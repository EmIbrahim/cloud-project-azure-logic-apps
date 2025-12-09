import { BlobServiceClient } from '@azure/storage-blob';

// CONFIGURATION
const STORAGE_ACCOUNT_NAME = 'expensefinreceiptstor';
const CONTAINER_NAME = 'raw-receipts';
const SAS_TOKEN = import.meta.env.VITE_SAS_TOKEN;

if (!SAS_TOKEN) {
  throw new Error('VITE_SAS_TOKEN is missing. Set it in your .env file (begins with ?sv=).');
}

// Initialize the Blob Service Client
const blobService = new BlobServiceClient(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${SAS_TOKEN}`
);

// Get the Container Client
const containerClient = blobService.getContainerClient(CONTAINER_NAME);

/**
 * Uploads a file directly to Azure Blob Storage
 * This automatically triggers the Logic App blob trigger which:
 * 1. Gets blob content
 * 2. Calls Document Intelligence API
 * 3. Extracts structured data
 * 4. Sends for manager approval
 * 5. Saves to SQL Database upon approval
 */
export const uploadReceipt = async (file) => {
  try {
    // Create a unique name: timestamp + original name cleaned up
    const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log(`Uploading ${blobName} to ${CONTAINER_NAME}...`);

    // Upload data to Blob Storage
    // This will automatically trigger the Logic App blob trigger
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type }
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
