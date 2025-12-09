# Azure Resource Connections - How Everything Connects

This document explains how the frontend application connects to Azure resources in your resource group.

## 🔗 Connection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (SWA)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐                 ┌──────────────────────┐
│  Azure Blob       │                 │  Azure SQL Database  │
│  Storage          │                 │  (ReceiptsDB)        │
│                   │                 │                      │
│  Container:       │                 │  Table: dbo.Receipts │
│  raw-receipts     │                 │  Table: dbo.Users    │
└───────────────────┘                 └──────────────────────┘
        │                                       │
        │                                       │ SWA Data API
        │                                       │ (REST Endpoints)
        │                                       │
        │                                       ▼
        │                            ┌──────────────────────┐
        │                            │  Static Web Apps     │
        │                            │  Data API            │
        │                            │                      │
        │                            │  /data-api/rest/     │
        │                            │    Receipt          │
        │                            │    Users             │
        │                            └──────────────────────┘
        │
        │ Blob Upload (SAS Token)
        │
        ▼
┌───────────────────┐
│  Logic App        │
│  (Blob Trigger)   │
│                   │
│  → Document       │
│    Intelligence   │
│  → Approval       │
│  → SQL Insert     │
└───────────────────┘
```

## 📡 Connection Methods

### 1. Azure Blob Storage Connection

**Method:** Direct SDK Upload with SAS Token  
**File:** `src/api/uploads.js`

```javascript
// Uses Azure Storage Blob SDK
import { BlobServiceClient } from '@azure/storage-blob';

// Connection String Format:
// https://{STORAGE_ACCOUNT}.blob.core.windows.net/{SAS_TOKEN}
const blobService = new BlobServiceClient(
  `https://expensefinreceiptstor.blob.core.windows.net/${SAS_TOKEN}`
);
```

**How it works:**
1. Frontend uses `@azure/storage-blob` SDK
2. Authenticates using `VITE_SAS_TOKEN` from environment variables
3. Uploads file directly to `raw-receipts` container
4. Logic App blob trigger automatically fires when file is uploaded

**Configuration:**
- **Storage Account:** `expensefinreceiptstor`
- **Container:** `raw-receipts`
- **Environment Variable:** `VITE_SAS_TOKEN` (starts with `?sv=...`)

**Security:**
- SAS token provides time-limited, scoped access
- Token includes only necessary permissions (read/write to specific container)

---

### 2. Azure SQL Database Connection

**Method:** Azure Static Web Apps Data API (REST)  
**File:** `src/api/dashboard.js`, `src/api/uploads.js`, `src/api/auth.js`

```javascript
// SWA Data API automatically exposes SQL tables as REST endpoints
const response = await axios.get('/data-api/rest/Receipt');
const receipts = response.data.value; // Data API returns array in 'value'
```

**How it works:**
1. **Configuration File:** `swa-db-connections/staticwebapp.database.config.json`
   - Defines which SQL tables to expose
   - Configures permissions (anonymous read, authenticated full access)
   - Maps SQL tables to REST endpoints

2. **Database Connection (Azure Portal):**
   - Static Web App → Database Connections → Add
   - Connection name: `default` (must match config file)
   - Database: `ReceiptsDB` on `receipts-sql-server`
   - Connection string stored securely by Azure

3. **REST Endpoints (Auto-generated):**
   - `/data-api/rest/Receipt` → `dbo.Receipts` table
   - `/data-api/rest/Users` → `dbo.Users` table
   - Supports OData query parameters (`$filter`, `$orderby`, etc.)

**Configuration:**
- **SQL Server:** `receipts-sql-server`
- **Database:** `ReceiptsDB`
- **Tables:** `dbo.Receipts`, `dbo.Users`
- **Config File:** `swa-db-connections/staticwebapp.database.config.json`
- **Connection Name:** `default` (in Azure Portal)

**Security:**
- Anonymous users: Read-only access
- Authenticated users: Full CRUD access
- Connection string stored securely in Azure (not exposed to frontend)
- HTTPS enforced

**Example Queries:**
```javascript
// Get all receipts
GET /data-api/rest/Receipt

// Filter by employee
GET /data-api/rest/Receipt?$filter=EmployeeId eq 'emp-001'

// Order by date
GET /data-api/rest/Receipt?$orderby=TransactionDate desc

// Get user by username
GET /data-api/rest/Users?$filter=Username eq 'cfo@acme.com'
```

---

### 3. Logic App Connection

**Method:** Automatic Blob Trigger (No Direct Frontend Call)

**How it works:**
1. Frontend uploads file to Blob Storage (see #1)
2. Blob Storage emits an event when new blob is created
3. Logic App has a **Blob Trigger** that listens to `raw-receipts` container
4. Logic App automatically processes the receipt:
   - Gets blob content
   - Calls Document Intelligence API
   - Extracts structured data
   - Sends for manager approval (Teams/Email)
   - Saves to SQL Database upon approval

**No Frontend Code Required:**
- Logic App runs independently
- Frontend only needs to upload to blob
- Processing happens automatically in the background

**Configuration:**
- **Logic App:** `receipt-core-logicapp`
- **Trigger:** Blob trigger on `raw-receipts` container
- **Storage Account:** `expensefinreceiptstor`

---

## 🔧 Environment Variables

All connections are configured via environment variables:

```env
# Blob Storage SAS Token
VITE_SAS_TOKEN="?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupx&se=..."

# API Endpoint (for relative paths)
VITE_API_ENDPOINT="http://localhost:5173"  # Local development
# In production, SWA handles /data-api/rest/ automatically
```

**Note:** `VITE_` prefix is required for Vite to expose variables to the frontend.

---

## 🚀 Deployment Checklist

### Before Deployment:
- [ ] `VITE_SAS_TOKEN` is set in `.env` file
- [ ] `swa-db-connections/staticwebapp.database.config.json` is in repository
- [ ] SQL Database `ReceiptsDB` exists with `dbo.Receipts` table
- [ ] SQL Database has `dbo.Users` table (for authentication)

### After Deployment:
1. **Configure Database Connection:**
   - Azure Portal → Static Web App → Database Connections
   - Add connection to `ReceiptsDB`
   - Connection name: `default`
   - Enter SQL connection string

2. **Set Environment Variables:**
   - Azure Portal → Static Web App → Configuration
   - Add `VITE_SAS_TOKEN` application setting
   - Save and restart

3. **Verify Connections:**
   - Test blob upload: Upload a receipt
   - Test SQL read: View dashboard (should show real data)
   - Test Logic App: Check Logic App runs history

---

## 🔍 Troubleshooting

### Blob Upload Fails
- **Error:** "VITE_SAS_TOKEN is missing"
  - **Solution:** Set `VITE_SAS_TOKEN` in `.env` file or Azure Portal Configuration

- **Error:** "403 Forbidden"
  - **Solution:** Check SAS token permissions and expiration date

### SQL Database Returns 404
- **Error:** "404 Not Found" on `/data-api/rest/Receipt`
  - **Solution:** 
    1. Verify database connection is configured in Azure Portal
    2. Check connection name is `default`
    3. Ensure `staticwebapp.database.config.json` is in repository
    4. Wait a few minutes after configuring connection

### SQL Database Returns 401/403
- **Error:** "401 Unauthorized" or "403 Forbidden"
  - **Solution:** Check permissions in `staticwebapp.database.config.json`
  - Verify authentication is configured in Static Web App settings

### Logic App Not Processing
- **Issue:** Receipt uploaded but Logic App doesn't run
  - **Solution:**
    1. Check Logic App is enabled
    2. Verify blob trigger is configured for `raw-receipts` container
    3. Check Logic App runs history in Azure Portal
    4. Verify storage account connection in Logic App

---

## 📚 Additional Resources

- [Azure Static Web Apps Data API Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/database-overview)
- [Azure Blob Storage SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob)
- [Azure Logic Apps Blob Trigger](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-workflow-actions-triggers#blob-trigger)

---

## ✅ Summary

**All connections are now direct to Azure resources:**
- ✅ **Blob Storage:** Direct SDK upload with SAS token
- ✅ **SQL Database:** SWA Data API REST endpoints
- ✅ **Logic App:** Automatic blob trigger (no direct frontend call)
- ✅ **No Mock Data:** All data comes from Azure resources
- ✅ **No Localhost Checks:** Always connects to production resources

The frontend is now fully integrated with your Azure resource group!

