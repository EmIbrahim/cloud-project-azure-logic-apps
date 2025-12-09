import { BlobServiceClient } from '@azure/storage-blob';

// CONFIGURATION
const STORAGE_ACCOUNT_NAME = 'expensefinreceiptstor';
const CONTAINER_NAME = 'raw-receipts';
const SAS_TOKEN = import.meta.env.VITE_SAS_TOKEN;
const LOGIC_APP_TRIGGER_URL = import.meta.env.VITE_LOGIC_APP_TRIGGER_URL;

if (!SAS_TOKEN) {
  throw new Error('VITE_SAS_TOKEN is missing. Set it in your .env file (begins with ?sv=).');
}

if (!LOGIC_APP_TRIGGER_URL) {
  console.warn('VITE_LOGIC_APP_TRIGGER_URL is not set. Analysis feature will not work.');
}

// Initialize the Blob Service Client
const blobService = new BlobServiceClient(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${SAS_TOKEN}`
);

// Get the Container Client
const containerClient = blobService.getContainerClient(CONTAINER_NAME);

/**
 * Analyzes a receipt file using Azure Logic App HTTP trigger
 * Sends file content directly to Logic App for AI analysis
 * Returns extracted JSON data for user review
 * 
 * @param {File} file - The receipt file (image, PDF, or CSV)
 * @returns {Promise<Object>} Extracted receipt data in JSON format
 */
export const analyzeReceipt = async (file) => {
  if (!LOGIC_APP_TRIGGER_URL) {
    throw new Error('Logic App trigger URL is not configured. Set VITE_LOGIC_APP_TRIGGER_URL in .env file.');
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

    // Upload file to blob storage temporarily (for later use when user confirms)
    const tempBlobName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(tempBlobName);

    console.log(`Uploading ${tempBlobName} to ${CONTAINER_NAME} for later processing...`);

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type }
    });

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
      blobName: tempBlobName,
      fileName: file.name
    };
  } catch (error) {
    console.error('Analysis Error:', error);
    throw new Error(`Failed to analyze receipt: ${error.message}`);
  }
};

/**
 * Uploads a receipt file to Azure Blob Storage for final processing
 * This triggers the Logic App blob trigger which processes and sends for approval
 * 
 * @param {File} file - The receipt file
 * @param {string} existingBlobName - Optional: blob name if file was already uploaded for analysis
 * @returns {Promise<Object>} Upload result
 */
export const uploadReceipt = async (file, existingBlobName = null) => {
  try {
    let blobName;
    
    if (existingBlobName) {
      // File already uploaded for analysis, copy it to final location (without temp prefix)
      // This will trigger the blob trigger for processing
      blobName = existingBlobName.replace(/^temp-/, '');
      const sourceBlob = containerClient.getBlockBlobClient(existingBlobName);
      const destBlob = containerClient.getBlockBlobClient(blobName);
      
      console.log(`Copying ${existingBlobName} to ${blobName} for processing...`);
      
      // Copy blob to final location (this will trigger blob trigger)
      const copyResponse = await destBlob.beginCopyFromURL(sourceBlob.url);
      
      // Wait for copy to complete
      let copyStatus = await destBlob.getProperties();
      let attempts = 0;
      while (copyStatus.copyStatus === 'pending' && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        copyStatus = await destBlob.getProperties();
        attempts++;
      }
      
      if (copyStatus.copyStatus === 'failed') {
        throw new Error('Failed to copy blob to final location');
      }
      
      // Delete temporary blob after successful copy
      try {
        await sourceBlob.delete();
      } catch (deleteError) {
        console.warn('Failed to delete temp blob:', deleteError);
        // Continue anyway - the copy was successful
      }
    } else {
      // Upload new file directly
      blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      console.log(`Uploading ${blobName} to ${CONTAINER_NAME}...`);

      await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type }
      });
    }

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
 * Fetches receipts from Azure SQL Database via SWA Data API
 * Returns receipts filtered by employee if employeeId is provided
 * 
 * Connection: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 * Endpoint: /data-api/rest/Receipt
 * Configured in: swa-db-connections/staticwebapp.database.config.json
 */
export const fetchReceipts = async (employeeId = null) => {
  try {
    let url = '/data-api/rest/Receipt';
    if (employeeId) {
      url += `?$filter=EmployeeId eq '${employeeId}'`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch receipts: ${response.statusText}`);
    }
    
    const data = await response.json();
    // SWA Data API returns data in 'value' array
    return data.value || data || [];
  } catch (error) {
    console.error('Fetch Receipts Error:', error);
    throw new Error(`Failed to load receipts: ${error.message}. Ensure the database connection is configured in Azure Portal.`);
  }
};
