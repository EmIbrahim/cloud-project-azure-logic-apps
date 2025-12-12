import { BlobServiceClient } from '@azure/storage-blob';

// CONFIGURATION
const STORAGE_ACCOUNT_NAME = 'expensefinreceiptstor';
const CONTAINER_NAME = 'raw-receipts';
const SAS_TOKEN = import.meta.env.VITE_SAS_TOKEN;
const LOGIC_APP_TRIGGER_URL = import.meta.env.VITE_LOGIC_APP_TRIGGER_URL;

// Lazy initialize blob client to avoid crashing build/runtime when env vars are missing (e.g., prod without uploads configured)
let containerClient = null;
const getContainerClient = () => {
  if (!SAS_TOKEN) {
    throw new Error('VITE_SAS_TOKEN is missing. Set it in your environment (starts with ?sv=).');
  }
  if (!containerClient) {
    const blobService = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${SAS_TOKEN}`
    );
    containerClient = blobService.getContainerClient(CONTAINER_NAME);
  }
  return containerClient;
};

/**
 * Analyzes a receipt file using Azure Logic App HTTP trigger
 * Sends file content directly to Logic App for AI analysis
 * Returns extracted JSON data for user review
 * 
 * @param {File} file - The receipt file (image, PDF, or CSV)
 * @returns {Promise<Object>} Extracted receipt data in JSON format
 */
export const analyzeReceipt = async (file, userInfo = null) => {
  if (!LOGIC_APP_TRIGGER_URL) {
    throw new Error('Logic App trigger URL is not configured. Set VITE_LOGIC_APP_TRIGGER_URL in your environment.');
  }

  try {
    // Convert file to base64 for sending to Logic App
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Call Logic App HTTP trigger for analysis
    // The Logic App will:
    // - Receive file content (base64)
    // - Call Document Intelligence API
    // - Extract structured data
    // - Return JSON response
    const response = await fetch(LOGIC_APP_TRIGGER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'analyze',
        fileName: file.name,
        fileContent: base64,
        contentType: file.type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Logic App analysis failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Analysis result:', result);

    // Step 3: Parse and return extracted data
    // Logic App may return data in different formats:
    // Format 1: Document Intelligence format
    //   { documents: [{ fields: { MerchantName: { valueString: "..." }, ... } }] }
    // Format 2: Direct fields format
    //   { fields: { MerchantName: { valueString: "..." }, ... } }
    // Format 3: Flat format
    //   { MerchantName: "...", TransactionDate: "...", Total: 123.45, ... }

    let extractedFields = null;

    if (result.documents && result.documents.length > 0) {
      // Document Intelligence format
      extractedFields = result.documents[0].fields;
    } else if (result.fields) {
      // Direct fields format
      extractedFields = result.fields;
    } else if (result.MerchantName || result.merchantName || result.merchant) {
      // Flat format - convert to fields format
      extractedFields = {
        MerchantName: result.MerchantName || result.merchantName || result.merchant
          ? { valueString: result.MerchantName || result.merchantName || result.merchant }
          : null,
        TransactionDate: result.TransactionDate || result.transactionDate || result.date
          ? { valueDate: result.TransactionDate || result.transactionDate || result.date }
          : null,
        Total: result.Total !== undefined || result.total !== undefined
          ? { valueNumber: parseFloat(result.Total || result.total || 0) }
          : null,
        Tax: result.Tax !== undefined || result.tax !== undefined
          ? { valueNumber: parseFloat(result.Tax || result.tax || 0) }
          : null,
        Tip: result.Tip !== undefined || result.tip !== undefined
          ? { valueNumber: parseFloat(result.Tip || result.tip || 0) }
          : null,
        Category: result.Category || result.category
          ? { valueString: result.Category || result.category }
          : null
      };
    } else {
      // Use result as-is
      extractedFields = result;
    }

    return {
      extractedData: extractedFields,
      fileName: file.name
    };
  } catch (error) {
    console.error('Analysis Error:', error);
    throw new Error(`Failed to analyze receipt: ${error.message}`);
  }
};

/**
 * Uploads a receipt file to Azure Blob Storage with metadata for processing
 * This triggers the Logic App blob trigger which processes and sends for approval
 * 
 * @param {File} file - The receipt file
 * @param {Object} userInfo - Optional: user information to attach as metadata
 * @returns {Promise<Object>} Upload result
 */
export const uploadReceipt = async (file, userInfo = null) => {
  try {
    const container = getContainerClient();
    // Upload file directly with metadata
    const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const blockBlobClient = container.getBlockBlobClient(blobName);

    console.log(`Uploading ${blobName} to ${CONTAINER_NAME}...`);

    // Prepare metadata for the blob
    const metadata = userInfo ? {
      userid: String(userInfo.id || ''),
      useremail: userInfo.email || '',
      username: userInfo.username || '',
      uploadedby: userInfo.name || ''
    } : {};

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type },
      metadata
    });

    console.log('Upload success! Logic App will process this automatically via blob trigger.');

    return {
      message: 'Receipt uploaded successfully',
      blobName,
      fileName: file.name
    };
  } catch (error) {
    console.error('Azure Upload Error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Fetches receipts from Azure SQL Database via Azure Functions or local proxy
 * Returns receipts filtered by employee if employeeId is provided
 * 
 * Connection: Azure Functions or local proxy → Azure SQL Database (ReceiptsDB)
 * Endpoint: /api/receipts
 */
// Get API base URL - mirrors logic from auth/dashboard helpers
const getApiUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  // Production: Use relative paths (Azure Functions are served from /api)
  return '';
};

/**
 * Fetch receipts for the current employee.
 * Uses unified API endpoint (works for both local and production).
 */
export const fetchReceipts = async (employeeId = null) => {
  try {
    const baseUrl = getApiUrl();

    // Fetch all receipts and filter client-side
    const response = await fetch(`${baseUrl}/api/receipts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch receipts: ${response.statusText}`);
    }
    
    const payload = await response.json();
    const all = payload.value || payload || [];
    
    if (!employeeId) {
      return all;
    }
    
    // Filter by employee ID
    const idStr = String(employeeId);
    const numericId = Number(employeeId);
    const hasNumeric = !Number.isNaN(numericId);
    
    return all.filter((r) => {
      const userIdStr = r.UserID != null ? String(r.UserID) :
                       r.UserId != null ? String(r.UserId) :
                       r.EmployeeId != null ? String(r.EmployeeId) : '';
      const username = r.Username || r.UserName || '';
      
      return userIdStr === idStr ||
             username === idStr ||
             (hasNumeric && (
               Number(r.UserID) === numericId ||
               Number(r.UserId) === numericId ||
               Number(r.EmployeeId) === numericId
             ));
    });
  } catch (error) {
    console.error('Fetch Receipts Error:', error);
    throw new Error(
      `Failed to load receipts: ${error.message}. Ensure the database connection is configured in Azure Portal.`
    );
  }
};
