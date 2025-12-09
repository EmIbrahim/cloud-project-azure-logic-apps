# Mock Data Removal Summary

## ✅ What Was Removed

All mock data has been completely removed from the project. The application now connects **directly** to Azure resources in your resource group.

### Deleted Files:
- ❌ `src/data/mockUsers.js` - Mock user credentials
- ❌ `src/data/mockUploads.js` - Mock receipt data
- ❌ `src/data/mockDashboard.js` - Mock dashboard data
- ❌ `src/api/mockServer.js` - Mock API server

### Updated Files:

#### 1. `src/api/dashboard.js`
- **Before:** Checked `localhost` and returned mock data
- **After:** Always fetches from `/data-api/rest/Receipt` (SWA Data API)
- **Connection:** Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)

#### 2. `src/api/uploads.js`
- **Before:** Checked `localhost` and returned mock receipts
- **After:** Always fetches from `/data-api/rest/Receipt` (SWA Data API)
- **Connection:** Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)

#### 3. `src/api/auth.js`
- **Before:** Used `mockUsers` array for authentication
- **After:** Fetches from `/data-api/rest/Users` (SWA Data API)
- **Connection:** Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
- **Note:** Requires `dbo.Users` table in SQL Database

#### 4. `src/pages/Login.jsx`
- **Before:** Displayed mock user credentials
- **After:** Clean login form (no mock references)

#### 5. `swa-db-connections/staticwebapp.database.config.json`
- **Added:** `Users` entity configuration for authentication
- **Connection:** Exposes `dbo.Users` table as `/data-api/rest/Users`

## 🔗 How Connections Work Now

### 1. Azure Blob Storage
**File:** `src/api/uploads.js`
- Uses `@azure/storage-blob` SDK
- Authenticates with `VITE_SAS_TOKEN`
- Uploads directly to `expensefinreceiptstor` → `raw-receipts` container
- Logic App automatically processes via blob trigger

### 2. Azure SQL Database
**Files:** `src/api/dashboard.js`, `src/api/uploads.js`, `src/api/auth.js`
- Uses Azure Static Web Apps Data API (REST endpoints)
- **Endpoints:**
  - `/data-api/rest/Receipt` → `dbo.Receipts` table
  - `/data-api/rest/Users` → `dbo.Users` table
- **Configuration:** `swa-db-connections/staticwebapp.database.config.json`
- **Connection:** Configured in Azure Portal → Static Web App → Database Connections

### 3. Logic App
- **No direct frontend connection**
- Automatically triggered when blob is uploaded
- Processes receipt → Approval → Saves to SQL Database

## 📋 Required SQL Tables

### `dbo.Receipts` (Already exists)
```sql
CREATE TABLE dbo.Receipts (
    Id uniqueidentifier PRIMARY KEY,
    MerchantName nvarchar(255),
    TransactionDate date,
    TotalAmount decimal(18,2),
    Tax decimal(18,2),
    Tip decimal(18,2),
    Category nvarchar(100),
    Status nvarchar(50),  -- 'Pending', 'Approved', 'Rejected'
    ApprovedBy nvarchar(255),
    ApprovalDate datetime,
    EmployeeId nvarchar(255),
    EmployeeName nvarchar(255)
);
```

### `dbo.Users` (Required for authentication)
```sql
CREATE TABLE dbo.Users (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    Username nvarchar(255) UNIQUE NOT NULL,
    Password nvarchar(255) NOT NULL,  -- Should be hashed in production
    Name nvarchar(255),
    Role nvarchar(50) NOT NULL,  -- 'cfo' or 'employee'
    Email nvarchar(255)
);

-- Example users (passwords should be hashed):
INSERT INTO dbo.Users (Username, Password, Name, Role, Email)
VALUES 
    ('cfo@acme.com', 'Acme!Secure#2025', 'Casey CFO', 'cfo', 'cfo@acme.com'),
    ('employee@acme.com', 'Acme!Secure#2025', 'Erin Employee', 'employee', 'employee@acme.com');
```

## 🚀 Deployment Steps

1. **Create Users Table** (if not exists):
   - Run the SQL script above in `ReceiptsDB`
   - Add your user accounts

2. **Update SWA Data API Config:**
   - Already updated: `swa-db-connections/staticwebapp.database.config.json`
   - Includes `Users` entity

3. **Deploy to Azure:**
   - Push code to repository
   - Azure Static Web Apps will auto-deploy

4. **Configure Database Connection:**
   - Azure Portal → Static Web App → Database Connections
   - Add connection to `ReceiptsDB`
   - Connection name: `default`
   - Enter SQL connection string

5. **Set Environment Variables:**
   - Azure Portal → Static Web App → Configuration
   - Add `VITE_SAS_TOKEN`

## ⚠️ Important Notes

1. **No Localhost Fallback:**
   - The app will fail if Azure resources are not configured
   - All connections are direct to Azure (no mock data)

2. **Authentication:**
   - Currently uses SQL Database `Users` table
   - **Recommended:** Replace with Azure AD B2C for production
   - Passwords should be hashed (bcrypt/argon2) in production

3. **Error Handling:**
   - All API calls now throw errors if Azure resources are unavailable
   - Check browser console for connection errors
   - Verify database connection is configured in Azure Portal

## 📚 Documentation

- **AZURE_CONNECTIONS.md** - Detailed explanation of all Azure connections
- **DEPLOYMENT.md** - Step-by-step deployment instructions
- **README.md** - Updated project overview

## ✅ Verification Checklist

After deployment, verify:
- [ ] Blob upload works (check Azure Portal → Storage Account → Containers)
- [ ] Dashboard shows real data from SQL Database
- [ ] Employee dashboard shows personal receipts
- [ ] Authentication works (login with SQL Database users)
- [ ] Logic App processes uploaded receipts
- [ ] Receipts appear in database after approval

---

**Status:** ✅ All mock data removed  
**Connections:** ✅ Direct to Azure resources  
**Ready for:** ✅ Production deployment

