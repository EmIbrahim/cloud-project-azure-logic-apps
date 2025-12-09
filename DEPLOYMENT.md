# Azure Static Web Apps Deployment Instructions

## Prerequisites
- Azure Static Web App created
- SQL Database `ReceiptsDB` accessible
- Database table `dbo.Receipts` exists

## Step 1: Update Environment Variables

Add the following to your `.env` file (if not already present):

```env
# Blob Storage SAS Token (Existing)
VITE_SAS_TOKEN="?sv=..."

# Logic App HTTP Trigger URL (Existing)
VITE_LOGIC_APP_TRIGGER_URL="https://your-logic-app-url/triggers/manual/paths/invoke?api-version=..."

# API Endpoint Logic
# On localhost, we mock. On Azure, SWA handles the relative path /data-api/rest/Receipt
VITE_API_ENDPOINT="http://localhost:5173"
```

## Step 2: Deploy to Azure Static Web Apps

1. Push your code to your repository (GitHub, Azure DevOps, etc.)
2. Azure Static Web Apps will automatically build and deploy

## Step 3: Configure Database Connection in Azure Portal

**CRITICAL:** After deployment, you MUST configure the database connection:

1. Go to **Azure Portal** → Your Static Web App
2. Navigate to **Database Connections** (in the left sidebar)
3. Click **Add** or **Connect database**
4. Select your SQL Database: `ReceiptsDB` on `receipts-sql-server`
5. **Connection name**: Use `default` (this matches the config file)
6. Enter your SQL Database connection string
7. Click **Save**

## Step 4: Verify Data API is Working

1. After connecting the database, wait a few minutes for the Data API to initialize
2. Test the endpoint: `https://your-swa-url.azurestaticapps.net/data-api/rest/Receipt`
3. You should see JSON data from your `Receipts` table

## Troubleshooting

### Data API returns 404
- Ensure database connection is configured in Azure Portal
- Verify connection name is `default`
- Check that `swa-db-connections/staticwebapp.database.config.json` is in your repository

### Data API returns 401/403
- Check permissions in `staticwebapp.database.config.json`
- Verify authentication is configured in Static Web App settings

### Data API returns empty array
- Verify SQL table `dbo.Receipts` exists and has data
- Check connection string is correct
- Review Static Web App logs for errors

## Local Development

When running locally (`npm run dev`):
- Dashboard will use mock data automatically
- No database connection needed for local development
- Console will show: "Localhost detected: Using Mock Data"

## Production

When deployed to Azure Static Web Apps:
- Dashboard will automatically fetch from `/data-api/rest/Receipt`
- Real SQL data will be displayed in charts
- No code changes needed - environment detection is automatic

