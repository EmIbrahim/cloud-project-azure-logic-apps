# Receipt Upload Workflow - Review & Confirm

## 🎯 New Workflow

The upload process now includes a **review step** before sending to CFO:

1. **Upload File** → User selects receipt (image, PDF, or CSV)
2. **AI Analysis** → File uploaded to blob, Logic App analyzes it
3. **Review Data** → Extracted data displayed in review table
4. **Confirm & Send** → User clicks "Send to CFO" to submit
5. **Processing** → Logic App processes and sends for approval

## 📋 Step-by-Step Process

### Step 1: File Selection
- User drags & drops or browses for file
- Supported formats: Images, PDFs, CSV files
- File is validated

### Step 2: AI Analysis
- File uploaded to Azure Blob Storage (temporary location with `temp-` prefix)
- Logic App HTTP trigger called for analysis
- Document Intelligence extracts structured data
- JSON response returned to frontend

### Step 3: Data Review
- Extracted data displayed in professional review table
- Fields shown:
  - Merchant Name
  - Transaction Date
  - Total Amount
  - Tax
  - Tip
  - Category
- User can review and verify accuracy

### Step 4: Send to CFO
- User clicks "Send to CFO" button
- File copied from temp location to final location (removes `temp-` prefix)
- This triggers Logic App blob trigger for processing
- Temporary blob deleted

### Step 5: Processing & Approval
- Logic App processes receipt
- Sends for manager approval (Teams/Email)
- Upon approval, saves to SQL Database
- Employee receives notification

## 🔧 Technical Implementation

### API Functions

#### `analyzeReceipt(file)`
- Uploads file to blob storage with `temp-` prefix
- Calls Logic App HTTP trigger with `action: 'analyze'`
- Returns extracted JSON data
- Handles multiple response formats from Logic App

#### `uploadReceipt(file, existingBlobName)`
- If `existingBlobName` provided: Copies temp blob to final location
- If not: Uploads new file directly
- Triggers Logic App blob trigger for processing

### Logic App HTTP Trigger

The Logic App should accept requests in this format:

```json
{
  "action": "analyze",
  "blobName": "temp-1234567890-receipt.jpg",
  "fileName": "receipt.jpg",
  "containerName": "raw-receipts"
}
```

And return data in one of these formats:

**Format 1: Document Intelligence Format**
```json
{
  "documents": [{
    "fields": {
      "MerchantName": { "valueString": "Starbucks" },
      "TransactionDate": { "valueDate": "2025-02-08" },
      "Total": { "valueNumber": 12.50 },
      "Tax": { "valueNumber": 1.00 },
      "Tip": { "valueNumber": 0.50 },
      "Category": { "valueString": "Food" }
    }
  }]
}
```

**Format 2: Direct Fields Format**
```json
{
  "fields": {
    "MerchantName": { "valueString": "Starbucks" },
    "TransactionDate": { "valueDate": "2025-02-08" },
    "Total": { "valueNumber": 12.50 }
  }
}
```

**Format 3: Flat Format**
```json
{
  "MerchantName": "Starbucks",
  "TransactionDate": "2025-02-08",
  "Total": 12.50,
  "Tax": 1.00,
  "Tip": 0.50,
  "Category": "Food"
}
```

The frontend automatically handles all three formats.

## 🔐 Environment Variables

Required in `.env` file:

```env
# Azure Blob Storage SAS Token
VITE_SAS_TOKEN="?sv=..."

# Logic App HTTP Trigger URL
VITE_LOGIC_APP_TRIGGER_URL="https://your-logic-app-url/triggers/manual/paths/invoke?api-version=..."
```

## 📱 User Interface

### Upload Area
- Drag & drop zone
- Browse button
- Loading spinner during analysis
- File format hints

### Review Card
- Professional table layout
- Extracted data fields
- Cancel button (returns to upload)
- "Send to CFO" button (confirms submission)

### Success Message
- Confirmation after successful submission
- Auto-resets after 5 seconds

## 🎨 UI Components

### Review Table
- Clean, striped table design
- Responsive layout
- Hover effects
- Professional styling

### Review Actions
- Cancel button (secondary style)
- Send to CFO button (primary style)
- Disabled states during processing

## ⚠️ Error Handling

- File upload errors
- Logic App analysis failures
- Blob copy errors
- Network timeouts
- Invalid file formats

All errors are displayed in an error banner at the top of the page.

## 🔄 Workflow Diagram

```
User Selects File
       ↓
Upload to Blob (temp-)
       ↓
Call Logic App HTTP Trigger (analyze)
       ↓
Display Extracted Data
       ↓
User Reviews & Clicks "Send to CFO"
       ↓
Copy Blob to Final Location
       ↓
Blob Trigger Fires → Logic App Processes
       ↓
Manager Approval → Database Save
```

## 📝 Notes

- CSV files are supported for bulk uploads
- Temporary blobs are automatically cleaned up
- The review step prevents accidental submissions
- All data is validated before display
- Multiple response formats are supported for flexibility

---

**Status:** ✅ Implemented  
**Last Updated:** 2025-02-08

