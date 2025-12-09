import { BlobServiceClient } from '@azure/storage-blob';
import { delay } from '../utils/delay';

// CONFIGURATION
// Move the SAS token into .env (VITE_SAS_TOKEN) so it is not hardcoded.
const STORAGE_ACCOUNT_NAME = 'expensefinreceiptstor';
const CONTAINER_NAME = 'raw-receipts'; // Ensure this container exists in the storage account!
const SAS_TOKEN = import.meta.env.VITE_SAS_TOKEN; // Must include leading ?sv=...&sig=...

if (!SAS_TOKEN) {
  // Fail early so misconfiguration is obvious in dev.
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
 */
export const uploadReceipt = async (file) => {
  try {
    // Check if container exists, create if not (safety check)
    // Note: You usually need specific permissions to create containers via SAS
    // If this fails, ensure the container 'raw-receipts' exists in Portal.
    // await containerClient.createIfNotExists();

    // Create a unique name: timestamp + original name cleaned up
    const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log(`Uploading ${blobName} to ${CONTAINER_NAME}...`);

    // Upload data
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type }
    });

    console.log('Upload success!');

    // Return a format that matches what your UI expects
    return {
      message: 'Successfully uploaded to Azure!',
      receipt: {
        id: blobName, // Use blob name as ID
        MerchantName: 'Analyzing...', // Placeholder until Logic App processes it
        TransactionDate: new Date().toISOString().slice(0, 10),
        TotalAmount: 0.0,
        Status: 'Uploaded to Cloud'
      }
    };
  } catch (error) {
    console.error('Azure Upload Error:', error);
    throw new Error(`Azure Upload Failed: ${error.message}`);
  }
};

export const fetchUploads = async () => {
  // MOCK: Keep this mock until Person B finishes the Database.
  // We cannot list "processed" receipts from Blob Storage easily because
  // Blob Storage only has images, not the extracted data (Merchant, Price).
  // That data lives in the SQL DB which Person B hasn't built yet.

  await delay(500);
  return [
    {
      id: 'mock-1',
      MerchantName: 'Example Upload (Mock)',
      TransactionDate: '2023-10-25',
      TotalAmount: 123.45,
      Status: 'Processed'
    }
  ];
};

export const processReceipt = async (id) => {
  // MOCK: Logic App triggers automatically on upload.
  // You don't need to manually "trigger" it from the frontend.
  await delay(1000);
  return { status: 'Triggered Logic App via Blob Event' };
};

