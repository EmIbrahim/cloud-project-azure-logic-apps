# Azure Static Web Apps Database Connection Setup Guide

## Problem: 500 Errors from Data API

If you're seeing `500 (Internal Server Error)` when accessing `/data-api/rest/Receipt` or `/data-api/rest/Users`, the database connection isn't properly configured in Azure Portal.

## Step-by-Step Fix

### 1. Get Your SQL Database Connection String

**Option A: From Azure Portal**
1. Go to Azure Portal → Your SQL Database (`ReceiptsDB`)
2. Click **Connection strings** in the left menu
3. Copy the **ADO.NET** connection string
4. Replace `{your_password}` with your actual SQL password

**Option B: Format Manually**
```
Server=tcp:YOUR_SERVER.database.windows.net,1433;Initial Catalog=ReceiptsDB;Persist Security Info=False;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### 2. Configure Database Connection in Azure Static Web Apps

1. **Go to Azure Portal** → Your Static Web App (`happy-forest-05d05dc00`)
2. **Navigate to Configuration** (in the left sidebar under Settings)
3. **Click "Application settings"** tab
4. **Add a new application setting:**
   - **Name:** `DATABASE_CONNECTION_STRING`
   - **Value:** Paste your full connection string from Step 1
   - **Click "OK"**
5. **Click "Save"** at the top
6. **Wait 2-3 minutes** for the Data API to restart

### 3. Verify Database Connection File is Deployed

Check that `swa-db-connections/staticwebapp.database.config.json` exists in your repository and was deployed:

1. Go to your GitHub/Azure DevOps repository
2. Verify the file exists at: `swa-db-connections/staticwebapp.database.config.json`
3. If missing, add it and push to trigger a new deployment

### 4. Test the Connection

After saving the configuration:

1. Wait 2-3 minutes for Azure to restart the Data API
2. Test the endpoint in your browser:
   ```
   https://happy-forest-05d05dc00.3.azurestaticapps.net/data-api/rest/Receipt
   ```
3. You should see JSON data, not a 500 error

### 5. Check Logs if Still Failing

1. Go to Azure Portal → Your Static Web App
2. Click **Log stream** (under Monitoring)
3. Look for errors related to database connection
4. Common issues:
   - **"Login failed"** → Wrong password in connection string
   - **"Cannot open database"** → Wrong database name or server
   - **"Timeout"** → Firewall blocking connection (see Step 6)

### 6. Configure SQL Server Firewall (If Needed)

If you see timeout errors:

1. Go to Azure Portal → Your SQL Server (not database)
2. Click **Networking** → **Public access**
3. Under **Firewall rules**, add:
   - **Rule name:** `AllowAzureServices`
   - **Start IP:** `0.0.0.0`
   - **End IP:** `0.0.0.0`
   - **Click "Save"**
4. Also check **"Allow Azure services and resources to access this server"** is enabled

## Alternative: Use Managed Identity (More Secure)

Instead of connection strings, you can use Managed Identity:

1. Go to Azure Portal → Your Static Web App
2. Click **Identity** → **System assigned** → **On** → **Save**
3. Go to your SQL Database → **Query editor** or **SQL Server Management Studio**
4. Run this SQL to grant access:
   ```sql
   CREATE USER [your-swa-name] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [your-swa-name];
   ALTER ROLE db_datawriter ADD MEMBER [your-swa-name];
   ```
5. Update `staticwebapp.database.config.json` to use Managed Identity (remove connection string)

## Verification Checklist

- [ ] `DATABASE_CONNECTION_STRING` is set in Azure Portal Configuration
- [ ] Connection string includes correct password (not `{your_password}`)
- [ ] `swa-db-connections/staticwebapp.database.config.json` exists in repository
- [ ] SQL Server firewall allows Azure services
- [ ] Waited 2-3 minutes after saving configuration
- [ ] Tested `/data-api/rest/Receipt` endpoint returns JSON (not 500)

## Still Not Working?

1. **Check Static Web App Logs:**
   - Portal → Your SWA → Log stream
   - Look for Data API errors

2. **Verify Table Names Match:**
   - Config file expects: `dbo.Receipts` and `dbo.Users`
   - Check your SQL database has these exact table names

3. **Test Connection String Locally:**
   - Use SQL Server Management Studio or Azure Data Studio
   - Try connecting with the same connection string
   - If it fails locally, the connection string is wrong

4. **Contact Support:**
   - Azure Portal → Your SWA → Help + support
   - Include error messages from Log stream

