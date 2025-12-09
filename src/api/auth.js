import axios from 'axios';

/**
 * Authenticates user against Azure SQL Database via SWA Data API
 * 
 * Connection: Azure Static Web Apps Data API → Azure SQL Database (ReceiptsDB)
 * Expected table: Users or Employees (configure in staticwebapp.database.config.json)
 * 
 * Note: If using Azure AD authentication, this should be replaced with
 * Azure Static Web Apps built-in authentication (.auth/login/aad)
 */
export const loginApi = async (username, password) => {
  try {
    // Fetch user from Azure SQL Database via SWA Data API
    // Adjust the endpoint based on your Users/Employees table name
    const response = await axios.get(
      `/data-api/rest/Users?$filter=Username eq '${encodeURIComponent(username)}'`
    );
    
    const users = response.data.value || [];
    const user = users[0];
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password (in production, use hashed passwords)
    // For now, assuming plain text comparison - should be replaced with bcrypt/hash comparison
    if (user.Password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Return user without password
    const { Password, ...safeUser } = user;
    return {
      id: safeUser.Id || safeUser.id,
      username: safeUser.Username || safeUser.username,
      name: safeUser.Name || safeUser.FullName || safeUser.name,
      role: safeUser.Role || safeUser.role || 'employee',
      email: safeUser.Email || safeUser.email || username
    };
  } catch (error) {
    console.error('Authentication Error:', error);
    if (error.response?.status === 404) {
      // Table might not exist - fallback message
      throw new Error('Authentication service not configured. Please configure Users table in SWA Data API.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
};

