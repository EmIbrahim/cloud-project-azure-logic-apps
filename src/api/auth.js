import axios from 'axios';

// Get API base URL - use local proxy server for local dev, Azure Functions for production
const getApiUrl = () => {
  // Check if we're on localhost
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    // Use local proxy server
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  
  // Production: Use relative paths (Azure Functions are served from /api)
  return '';
};

/**
 * Authenticates user against Azure SQL Database via Azure Functions or local proxy
 * 
 * Connection: 
 * - Localhost: Express proxy → Azure SQL Database (ReceiptsDB)
 * - Production: Azure Functions → Azure SQL Database (ReceiptsDB)
 * Table: dbo.Users
 */
export const loginApi = async (username, password) => {
  try {
    const baseUrl = getApiUrl();
    const endpoint = `${baseUrl}/api/login`;
    
    console.log('Login API Call:', {
      isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      baseUrl,
      endpoint
    });
    
    // Use unified API endpoint (works for both local and production)
    const response = await axios.post(endpoint, {
      username,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    // Both local and Azure Functions return user directly
    return response.data;
  } catch (error) {
    console.error('Authentication Error:', error);
    
    if (error.response?.status === 500) {
      const errorMsg = error.response?.data || error.response?.statusText || 'Data API call failure';
      throw new Error(`Database connection failed (500). Please configure DATABASE_CONNECTION_STRING in Azure Portal → Configuration → Application settings. Error: ${errorMsg}`);
    }
    
    if (error.response?.status === 404) {
      throw new Error('Users table not found. Please ensure the database connection is configured.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Invalid credentials');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Access denied. Please check database permissions.');
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Connection timeout. Please check your network connection.');
    }
    
    if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
      const isLocal = window.location.hostname === 'localhost';
      if (isLocal) {
        throw new Error('Cannot connect to auth server. Make sure to run "npm run dev:server" in a separate terminal.');
      } else {
        throw new Error('Cannot connect to database. Please check your connection settings.');
      }
    }
    
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed');
  }
};

