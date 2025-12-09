import axios from 'axios';

// Get API base URL - use local proxy server for local dev, SWA Data API for production
const getApiUrl = () => {
  // Check if we're on localhost
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    // Use local proxy server
    const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || 'http://localhost:3001';
    return proxyUrl;
  }
  
  // Production: Use SWA Data API
  const dataApiUrl = import.meta.env.VITE_DATA_API_URL;
  if (dataApiUrl) {
    return dataApiUrl.endsWith('/') ? dataApiUrl.slice(0, -1) : dataApiUrl;
  }
  // Default to relative path (works when deployed to SWA)
  return '';
};

/**
 * Authenticates user against Azure SQL Database via SWA Data API
 * 
 * Connection: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 * Table: dbo.Users
 * 
 * Environment Variables:
 * - VITE_DATA_API_URL: (Optional) Full URL to SWA Data API, e.g., "https://your-app.azurestaticapps.net/data-api"
 *   If not set, uses relative path "/data-api" (works when deployed)
 */
export const loginApi = async (username, password) => {
  try {
    const baseUrl = getApiUrl();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let response;
    
    if (isLocal) {
      // Use local proxy server
      response = await axios.post(`${baseUrl}/api/auth/login`, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // Proxy server returns user directly
      return response.data;
    } else {
      // Use SWA Data API
      const endpoint = `${baseUrl}/data-api/rest/Users?$filter=Username eq '${encodeURIComponent(username)}'`;
      
      response = await axios.get(endpoint, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      const users = response.data.value || response.data || [];
      const user = Array.isArray(users) ? users[0] : users;
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      const userPassword = user.Password || user.password;
      if (userPassword !== password) {
        throw new Error('Invalid credentials');
      }
      
      // Return user without password
      const { Password, password: _, ...safeUser } = user;
      return {
        id: safeUser.Id || safeUser.id,
        username: safeUser.Username || safeUser.username || username,
        name: safeUser.Name || safeUser.FullName || safeUser.name || username,
        role: (safeUser.Role || safeUser.role || 'employee').toLowerCase(),
        email: safeUser.Email || safeUser.email || username
      };
    }
  } catch (error) {
    console.error('Authentication Error:', error);
    
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

