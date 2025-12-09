# Receipt Automation System

**End-to-end cloud-based receipt processing system** built with Azure Logic Apps, React, and Azure services.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## 📋 Project Overview

This is a **3-person team project** implementing a complete receipt automation workflow:

- **Person A**: Infrastructure & Logic App Core ✅
- **Person B**: Human Approval & External Integrations ✅  
- **Person C**: Frontend & Dashboard ✅ (This repository)

## 🏗️ Architecture

### Azure Resources (All in Resource Group)

- **expensefinreceiptstor** - Storage Account (`raw-receipts` container)
- **expensediservice** - Document Intelligence Service
- **expense-kv** - Key Vault (secrets management)
- **receipt-core-logicapp** - Logic App (workflow automation)
- **receipts-sql-server/ReceiptsDB** - SQL Database
- **formrecognizer** - API Connection

### Complete Workflow

1. **Employee uploads receipt** → Azure Blob Storage
2. **Logic App triggers** → Blob event detection
3. **Document Intelligence** → Extracts structured data
4. **Manager approval** → Teams/Email adaptive cards
5. **Database storage** → SQL Database (upon approval)
6. **Frontend displays** → Real-time analytics dashboards

## 🎯 Features

### Employee Features
- ✅ Drag & drop receipt upload
- ✅ Mobile camera capture
- ✅ Personal dashboard with spending stats
- ✅ Receipt status tracking
- ✅ Monthly totals and reimbursement status

### CFO Features
- ✅ Total Spend by Vendor analytics
- ✅ Daily Expense Trend charts
- ✅ Pending Approvals tracking
- ✅ Employee Monthly Spending vs Salary
- ✅ PowerBI integration ready

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Azure Blob Storage SAS Token
VITE_SAS_TOKEN="?sv=..."

# API Endpoint (for local development)
VITE_API_ENDPOINT="http://localhost:5173"

# PowerBI Embed URL (optional)
VITE_POWERBI_EMBED_URL="https://app.powerbi.com/view?r=..."
```

### Azure Static Web Apps Data API

**File:** `swa-db-connections/staticwebapp.database.config.json`

After deployment:
1. Azure Portal → Static Web App → Database Connections
2. Add connection to `ReceiptsDB`
3. Connection name: `default`
4. Enter SQL connection string

## 📦 Project Structure

```
src/
├── api/
│   ├── uploads.js          # Blob Storage upload & receipt fetching
│   ├── dashboard.js       # Dashboard data (CFO & Employee)
│   └── auth.js             # Authentication
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Upload.jsx          # Employee upload page
│   ├── Dashboard.jsx       # CFO dashboard
│   └── EmployeeDashboard.jsx  # Employee dashboard
├── components/
│   ├── Layout/             # Header, Sidebar, Footer
│   ├── common/             # Spinner, ErrorBanner
│   └── dashboard/          # PowerBI component
├── context/
│   ├── AuthContext.jsx     # Authentication state
│   └── AppDataContext.jsx   # Dashboard data state
└── utils/
    └── delay.js             # Utility functions
```

## 🧪 Local Development

**Note:** All mock data has been removed. The application now connects directly to Azure resources.

- **Blob Storage**: Requires `VITE_SAS_TOKEN` in `.env` file
- **SQL Database**: Requires SWA Data API connection (configured after deployment)
- **Authentication**: Requires `Users` table in SQL Database or Azure AD integration

## 🌐 Production Deployment

### Prerequisites
- Azure Static Web App created
- SQL Database accessible
- Database connection configured

### Steps

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   - Push to GitHub/Azure DevOps
   - Azure auto-deploys
   - Or use: `az staticwebapp deploy`

3. **Configure Database:**
   - Azure Portal → Static Web App → Database Connections
   - Add `ReceiptsDB` connection
   - Name: `default`

4. **Set Environment Variables:**
   - Azure Portal → Static Web App → Configuration
   - Add `VITE_SAS_TOKEN`

## 🔐 Authentication

**Current Implementation:**
- Authenticates against `dbo.Users` table in SQL Database via SWA Data API
- Endpoint: `/data-api/rest/Users`
- **Recommended:** Replace with Azure AD B2C for production use

**Required SQL Table:**
```sql
CREATE TABLE dbo.Users (
    Id uniqueidentifier PRIMARY KEY,
    Username nvarchar(255) UNIQUE NOT NULL,
    Password nvarchar(255) NOT NULL,  -- Should be hashed in production
    Name nvarchar(255),
    Role nvarchar(50),  -- 'cfo' or 'employee'
    Email nvarchar(255)
);
```

## 📊 Data Flow

**All environments connect directly to Azure:**

```
Frontend (React)
  ↓
Azure Blob Storage (SAS Token) → Logic App (Blob Trigger) → SQL Database
  ↓
Azure Static Web Apps Data API → SQL Database (Receipts, Users)
  ↓
Frontend (Charts & Dashboards)
```

**No Mock Data:** All data comes from Azure resources.

## 🐛 Troubleshooting

### Upload Issues
- Verify SAS token has write permissions
- Check container `raw-receipts` exists
- Review browser console errors

### Dashboard Issues
- Verify SWA Data API connection configured
- Check database connection string
- Ensure `Receipts` table has data
- Review browser console for API errors

### Logic App Issues
- Check Logic App runs history in Azure Portal
- Verify blob trigger is enabled
- Ensure container name matches

## 📚 Documentation

- **PROJECT_README.md** - Complete project documentation
- **DEPLOYMENT.md** - Deployment instructions
- **AZURE_CONNECTIONS.md** - Detailed explanation of Azure resource connections

## 🎨 Design

- Clean, minimalist corporate design
- Professional color scheme (Slate/Gray + Indigo)
- Responsive layout (mobile-friendly)
- Loading states and error handling
- Accessible components

## 📝 Tech Stack

- **Frontend**: React 18, Vite 6
- **Routing**: React Router DOM 6
- **Charts**: Recharts 2
- **Storage**: Azure Blob Storage SDK
- **Database**: Azure SQL Database (via SWA Data API)
- **Deployment**: Azure Static Web Apps
- **Styling**: Custom CSS (minimalist design system)

## 🔄 Integration Points

1. **Blob Storage**: Direct upload via SAS token
2. **Logic App**: Triggered automatically via blob events
3. **SQL Database**: Accessed via SWA Data API
4. **Document Intelligence**: Used by Logic App (not frontend)

## ✅ Project Status

- ✅ Employee upload functionality
- ✅ CFO dashboard with charts
- ✅ Employee dashboard with stats
- ✅ Azure Static Web Apps integration
- ✅ SWA Data API configuration
- ✅ PowerBI placeholder
- ✅ Error handling & loading states
- ✅ Responsive design
- ✅ Production-ready code

---

**Built for Cloud Computing Course** • Azure Logic Apps Project
