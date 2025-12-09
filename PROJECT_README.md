# Receipt Automation System - Complete Project Documentation

## 🎯 Project Overview

This is an **end-to-end cloud-based receipt automation system** built with Azure Logic Apps, React, and Azure services. The system automates receipt processing from upload to approval, using AI-powered document intelligence and workflow automation.

## 🏗️ Architecture Overview

### Azure Resource Group Components

All resources are deployed in a single Azure Resource Group:

1. **expensefinreceiptstor** - Storage Account
   - Container: `raw-receipts`
   - Stores uploaded receipt images/PDFs
   - Triggers Logic App via blob events

2. **expensediservice** - Document Intelligence Service
   - Prebuilt Receipt Model
   - Extracts structured data from receipts
   - Used by Logic App for AI processing

3. **expense-kv** - Key Vault
   - Stores all secrets securely
   - Storage connection strings
   - Document Intelligence keys
   - SQL Database connection strings
   - Accessed by Logic App via Managed Identity

4. **receipt-core-logicapp** - Logic App (Consumption Plan)
   - **Blob Trigger**: Automatically triggers when receipt is uploaded
   - **Workflow**: Gets blob → Calls Document Intelligence → Extracts data → Sends for approval → Saves to SQL
   - **Approval**: Teams/Email adaptive cards with Approve/Reject buttons
   - **Notifications**: Slack/Teams notifications to employees

5. **receipts-sql-server** - SQL Server
   - **ReceiptsDB** - SQL Database
   - **Receipts Table**: Stores all processed receipts
   - Columns: Id, MerchantName, TransactionDate, TotalAmount, Tax, Tip, Category, Status, ApprovedBy, ApprovalDate, EmployeeId, EmployeeName

6. **formrecognizer** - API Connection
   - Connects Logic App to Document Intelligence service

## 👥 Team Division & Phases

### Person A - Infrastructure & Logic App Core ✅
**Completed:**
- Azure Resource Group setup
- Storage Account with `raw-receipts` container
- Document Intelligence service deployment
- Key Vault with all secrets
- Logic App with blob trigger
- Document Intelligence integration
- Data extraction and sanitization

### Person B - Human Approval & External Integrations ✅
**Completed:**
- SQL Database (`ReceiptsDB`) with `Receipts` table
- Logic App approval workflow
- Teams/Email adaptive cards for approval
- Database inserts with parameterized queries
- Slack/Teams notifications
- Error handling for failed operations

### Person C - Frontend & Dashboard ✅ (YOU)
**Completed:**
- React + Vite application
- Employee Upload View with drag-drop/camera
- CFO Dashboard with analytics charts
- Employee Dashboard with personal stats
- Azure Static Web Apps deployment
- SWA Data API integration
- PowerBI placeholder integration

## 🔄 Complete Workflow

### 1. Employee Uploads Receipt
```
Frontend (React) 
  → Uploads directly to Azure Blob Storage (raw-receipts container)
  → Uses SAS token for secure upload
  → Shows confirmation message
```

### 2. Logic App Processes Automatically
```
Blob Trigger (Logic App)
  → Detects new blob in raw-receipts container
  → Gets blob content
  → Calls Document Intelligence API (expensediservice)
  → Extracts: MerchantName, TransactionDate, TotalAmount, Tax, Tip, Category
  → Sanitizes and standardizes data
  → Creates ReceiptPayload JSON
```

### 3. Manager Approval
```
Logic App
  → Sends Teams/Email adaptive card to manager
  → Adaptive card contains Approve/Reject buttons
  → Waits for manager response
```

### 4. Approved Receipt Processing
```
Logic App (Approved Branch)
  → Inserts receipt into SQL Database (ReceiptsDB)
  → Uses Key Vault connection string
  → Sets Status = 'Approved'
  → Records ApprovedBy and ApprovalDate
  → Sends Slack/Teams notification to employee
```

### 5. Rejected Receipt Processing
```
Logic App (Rejected Branch)
  → Sets Status = 'Rejected'
  → Sends rejection email to employee
  → Optionally saves to database with Rejected status
```

### 6. Frontend Displays Data
```
Frontend (React)
  → CFO Dashboard: Fetches from SQL via SWA Data API
  → Employee Dashboard: Shows personal receipts and stats
  → Charts update dynamically as new receipts are approved
```

## 📁 Frontend Application Structure

### Pages
- **Login** (`/login`) - Authentication page
- **Upload** (`/upload`) - Employee receipt upload (drag-drop, camera)
- **Employee Dashboard** (`/my-dashboard`) - Employee personal dashboard
- **CFO Dashboard** (`/dashboard`) - CFO analytics dashboard

### Key Features

#### Employee Features
- ✅ Drag & drop receipt upload
- ✅ Mobile camera capture support
- ✅ Direct upload to Azure Blob Storage
- ✅ Personal dashboard with:
  - Monthly spending total
  - Receipt status counts (Pending/Approved/Rejected)
  - Recent receipts list
  - Status tracking

#### CFO Features
- ✅ Total Spend by Vendor chart
- ✅ Daily Expense Trend chart
- ✅ Pending Approvals chart
- ✅ Employee Monthly Spending vs Salary chart
- ✅ PowerBI integration placeholder
- ✅ Real-time data from SQL Database

### API Integration

#### `src/api/uploads.js`
- `uploadReceipt(file)` - Uploads to Azure Blob Storage
- `fetchReceipts(employeeId?)` - Fetches receipts from SQL Database

#### `src/api/dashboard.js`
- `fetchDashboard()` - Fetches CFO dashboard data
- `fetchEmployeeDashboard(employeeId)` - Fetches employee dashboard data
- Data transformation functions for charts

### Data Flow

```
Local Development:
  → Uses mock data automatically
  → No Azure connection needed
  → Console logs: "Localhost detected: Using Mock Data"

Production (Azure Static Web Apps):
  → Automatically detects production environment
  → Fetches from `/data-api/rest/Receipt` (SWA Data API)
  → Connects to SQL Database via configured connection
  → Real-time data updates
```

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Azure Blob Storage SAS Token
# Get from: Azure Portal → Storage Account → Shared access signature
VITE_SAS_TOKEN="?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupx&se=..."

# Azure Static Web Apps Data API (for local development)
VITE_API_ENDPOINT="http://localhost:5173"

# PowerBI Embed URL (optional)
VITE_POWERBI_EMBED_URL="https://app.powerbi.com/view?r=..."
```

### Azure Static Web Apps Data API Configuration

**File:** `swa-db-connections/staticwebapp.database.config.json`

This file configures the Data API to expose the SQL Database:
- Entity: `Receipt` → Maps to `dbo.Receipts` table
- Permissions: Anonymous read, Authenticated full access
- Connection: Uses `DATABASE_CONNECTION_STRING` from Azure Portal

**After Deployment:**
1. Go to Azure Portal → Static Web App
2. Navigate to **Database Connections**
3. Add connection to `ReceiptsDB`
4. Connection name: `default`
5. Enter SQL connection string

## 🚀 Deployment

### Prerequisites
- Azure Static Web App created
- SQL Database accessible
- Database connection configured in Azure Portal

### Steps

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Azure Static Web Apps:**
   - Push to GitHub/Azure DevOps
   - Azure will auto-deploy
   - Or use Azure CLI: `az staticwebapp deploy`

3. **Configure Database Connection:**
   - Azure Portal → Static Web App → Database Connections
   - Add connection to `ReceiptsDB`
   - Connection name: `default`
   - Enter SQL connection string

4. **Set Environment Variables:**
   - Azure Portal → Static Web App → Configuration
   - Add `VITE_SAS_TOKEN`
   - Add `VITE_POWERBI_EMBED_URL` (if using PowerBI)

## 🧪 Testing

### Local Development
```bash
npm run dev
```
- Uses mock data automatically
- No Azure connection required
- Test UI/UX functionality

### Production Testing
1. Upload a receipt → Should appear in blob storage
2. Check Logic App runs → Should process automatically
3. Approve via Teams/Email → Should save to database
4. View dashboard → Should show real data

## 📊 Database Schema

### Receipts Table (`dbo.Receipts`)

| Column | Type | Description |
|--------|------|-------------|
| Id | uniqueidentifier/nvarchar | Primary key |
| MerchantName | nvarchar | Extracted merchant name |
| TransactionDate | date/datetime | Transaction date |
| TotalAmount | decimal | Total amount |
| Tax | decimal | Tax amount |
| Tip | decimal | Tip amount |
| Category | nvarchar | Expense category |
| Status | nvarchar | Pending/Approved/Rejected |
| ApprovedBy | nvarchar | Manager who approved |
| ApprovalDate | datetime | When approved |
| EmployeeId | nvarchar | Employee identifier |
| EmployeeName | nvarchar | Employee name |

## 🔐 Security

- ✅ SAS tokens for blob access (time-limited, scoped permissions)
- ✅ Key Vault for all secrets
- ✅ Managed Identity for Logic App → Key Vault access
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ SWA Data API with role-based permissions
- ✅ HTTPS enforced via Azure Static Web Apps

## 📈 Analytics & Reporting

### CFO Dashboard Charts
1. **Total Spend by Vendor** - Bar chart showing top vendors
2. **Daily Expense Trend** - Line chart showing spending over time
3. **Pending Approvals** - Bar chart showing pending receipts by employee
4. **Employee Monthly Spending vs Salary** - Comparison chart

### PowerBI Integration
- Placeholder component ready for PowerBI embed
- Can connect to SQL Database dataset
- Refresh via Logic App or PowerBI Gateway

## 🐛 Troubleshooting

### Upload not working
- Check SAS token is valid and has write permissions
- Verify container `raw-receipts` exists
- Check browser console for errors

### Dashboard shows no data
- Verify SWA Data API connection is configured
- Check database connection string in Azure Portal
- Ensure `Receipts` table has data
- Check browser console for API errors

### Logic App not triggering
- Verify blob trigger is enabled
- Check Logic App runs history
- Ensure container name matches: `raw-receipts`
- Verify blob upload succeeded

## 🎨 UI/UX Features

- ✅ Clean, minimalist corporate design
- ✅ Responsive layout (mobile-friendly)
- ✅ Professional color scheme (Slate/Gray + Indigo)
- ✅ Loading states and error handling
- ✅ Empty states for better UX
- ✅ Status badges and visual feedback
- ✅ Accessible components

## 📝 Next Steps / Enhancements

1. **Authentication**: Replace mock auth with Azure AD B2C
2. **Real-time Updates**: Add SignalR for live dashboard updates
3. **PowerBI**: Implement full PowerBI embed with tokens
4. **Notifications**: Add in-app notifications for employees
5. **Export**: Add CSV/PDF export functionality
6. **Search/Filter**: Add receipt search and filtering
7. **Bulk Upload**: Support multiple file uploads

## 📞 Support

For issues or questions:
1. Check Azure Portal → Logic App runs history
2. Review browser console for frontend errors
3. Check Azure Portal → Static Web App logs
4. Verify all environment variables are set

---

**Built with:** React, Vite, Azure Logic Apps, Azure Blob Storage, Azure Logic Apps, Document Intelligence, SQL Database, Azure Static Web Apps

