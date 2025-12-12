# Migration from SWA Data API to Azure Functions

## Summary

This project has been migrated from Azure Static Web Apps Data API (deprecated) to Azure Functions while maintaining full local development parity.

## Changes Made

### 1. Azure Functions Created (`api/` folder)

Three Azure Functions have been created:

- **`api/receipts/index.js`** - GET endpoint for fetching all receipts
- **`api/users/index.js`** - GET endpoint for fetching all users
- **`api/login/index.js`** - POST endpoint for user authentication

Each function includes:
- `index.js` - Function code
- `function.json` - HTTP trigger configuration

### 2. Local Server Updated (`server.js`)

- **Route renamed**: `/api/auth/login` → `/api/login`
- **New route added**: `/api/users` (GET)
- **Response format**: All endpoints now return `{ value: [] }` format to match Azure Functions

### 3. Frontend API Files Updated

All frontend API calls now use unified endpoints that work identically in both environments:

- **`src/api/auth.js`**: Uses `/api/login` (POST)
- **`src/api/dashboard.js`**: Uses `/api/receipts` (GET) and `/api/users` (GET)
- **`src/api/uploads.js`**: Uses `/api/receipts` (GET)

## API Endpoints

### Production (Azure Functions)
- `GET /api/receipts` - Fetch all receipts
- `GET /api/users` - Fetch all users
- `POST /api/login` - Authenticate user

### Local Development (Express Proxy)
- `GET http://localhost:3001/api/receipts` - Fetch all receipts
- `GET http://localhost:3001/api/users` - Fetch all users
- `POST http://localhost:3001/api/login` - Authenticate user

## Environment Variables

### Azure Portal Configuration
Set `DATABASE_CONNECTION_STRING` in Azure Portal → Static Web App → Configuration → Application settings

Format:
```
Server=tcp:your-server.database.windows.net,1433;Initial Catalog=ReceiptsDB;User ID=your_username;Password=your_password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Important**: If your password contains special characters, URL-encode them:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- etc.

### Local Development (`.env` file)
```
SQL_USER=your_username
SQL_PASSWORD=your_password
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=ReceiptsDB
VITE_AUTH_PROXY_URL=http://localhost:3001
```

## Response Format

All endpoints return data in the same format:

**Receipts/Users:**
```json
{
  "value": [
    { /* receipt/user object */ }
  ]
}
```

**Login:**
```json
{
  "id": 1,
  "username": "ibrahim",
  "name": "Ibrahim",
  "role": "employee",
  "email": "m.farid.27098@khi.iba.edu.pk"
}
```

## Testing

### Local Development
1. Start the proxy server: `npm run dev:server`
2. Start the frontend: `npm run dev`
3. The app will use `http://localhost:3001` for API calls

### Production
1. Deploy to Azure Static Web Apps
2. Ensure `DATABASE_CONNECTION_STRING` is set in Azure Portal
3. The app will automatically use `/api/*` endpoints (Azure Functions)

## Benefits

✅ **Unified API**: Same endpoints work in both environments  
✅ **No Code Changes**: Frontend automatically detects environment  
✅ **Better Control**: Full control over API logic and error handling  
✅ **Future-Proof**: Using Azure Functions instead of deprecated Data API  
✅ **Local Parity**: Identical behavior in local and production

## Troubleshooting

### 500 Errors in Production
- Verify `DATABASE_CONNECTION_STRING` is set in Azure Portal
- Check SQL Server firewall allows Azure services
- Verify connection string format is correct
- Check Azure Functions logs in Azure Portal

### Local Development Issues
- Ensure `.env` file has all SQL connection variables
- Verify `npm run dev:server` is running
- Check that port 3001 is not in use

### Authentication Failures
- Verify user exists in `dbo.Users` table
- Check password matches exactly (case-sensitive)
- Ensure `Username` column exists in Users table





