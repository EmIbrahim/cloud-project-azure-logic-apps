// Simple Express server for local development
// Connects directly to Azure SQL Database for authentication
import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Azure SQL Database connection configuration
const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER, // e.g., 'receipts-sql-server.database.windows.net'
  database: process.env.SQL_DATABASE, // e.g., 'ReceiptsDB'
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth proxy server is running' });
});

// Receipts endpoint - queries Receipts table directly for dashboard data
app.get('/api/receipts', async (req, res) => {
  console.log('\n=== FETCHING RECEIPTS ===');
  
  try {
    // Create connection pool (reuses connections)
    const pool = await sql.connect(sqlConfig);
    console.log('✓ Connected to SQL Database');
    
    // First, get the actual column names from the Receipts table
    const columnsResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Receipts'
        ORDER BY ORDINAL_POSITION
      `);
    
    const columns = columnsResult.recordset.map(row => row.COLUMN_NAME);
    console.log('✓ Receipts table columns found:', columns);
    
    // Build SELECT query with actual column names
    const selectColumns = columns.join(', ');
    
    // Find date column for ordering
    const dateCol = columns.find(col => 
      col.toLowerCase() === 'transactiondate' || 
      col.toLowerCase() === 'transaction_date' ||
      col.toLowerCase() === 'date' ||
      col.toLowerCase() === 'createddate' ||
      col.toLowerCase() === 'created_date'
    );
    
    const orderBy = dateCol ? `ORDER BY [${dateCol}] DESC` : '';
    console.log('✓ Using date column for ordering:', dateCol || 'none');
    
    // Query Receipts table with actual column names
    const query = `SELECT ${selectColumns} FROM dbo.Receipts ${orderBy}`;
    console.log('✓ Executing query:', query.substring(0, 100) + '...');
    
    const result = await pool.request().query(query);
    
    const receipts = result.recordset;
    console.log(`✓ Query returned ${receipts.length} receipt(s)`);
    
    // Clean up string fields that might have extra quotes (e.g., Status: '"Approved"' -> 'Approved')
    const cleanedReceipts = receipts.map(receipt => {
      const cleaned = { ...receipt };
      // Clean Status field
      if (cleaned.Status && typeof cleaned.Status === 'string') {
        cleaned.Status = cleaned.Status.replace(/^["']|["']$/g, '').trim();
      }
      // Clean ApprovedBy field if it exists
      if (cleaned.ApprovedBy && typeof cleaned.ApprovedBy === 'string') {
        cleaned.ApprovedBy = cleaned.ApprovedBy.replace(/^["']|["']$/g, '').trim();
      }
      // Clean EmployeeName field if it exists
      if (cleaned.EmployeeName && typeof cleaned.EmployeeName === 'string') {
        cleaned.EmployeeName = cleaned.EmployeeName.replace(/^["']|["']$/g, '').trim();
      }
      return cleaned;
    });
    
    if (cleanedReceipts.length > 0) {
      console.log('✓ Sample receipt (before cleanup):', {
        Status: receipts[0].Status,
        ApprovedBy: receipts[0].ApprovedBy
      });
      console.log('✓ Sample receipt (after cleanup):', {
        Status: cleanedReceipts[0].Status,
        ApprovedBy: cleanedReceipts[0].ApprovedBy
      });
    }
    
    console.log('=== END FETCH RECEIPTS ===\n');
    
    // Format response to match SWA Data API format
    res.json({
      value: cleanedReceipts
    });
  } catch (error) {
    console.error('\n✗ SQL Error fetching receipts:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', {
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName
    });
    console.log('=== END FETCH RECEIPTS (ERROR) ===\n');
    
    if (error.code === 'ELOGIN') {
      res.status(500).json({ 
        error: 'Database authentication failed',
        message: 'Please check SQL_USER and SQL_PASSWORD in .env file'
      });
    } else if (error.code === 'ETIMEOUT') {
      res.status(500).json({ 
        error: 'Database connection timeout',
        message: 'Please check SQL_SERVER and network connection'
      });
    } else {
      res.status(500).json({ 
        error: 'Database connection failed',
        message: error.message 
      });
    }
  }
});

// Users endpoint - queries Users table directly
app.get('/api/users', async (req, res) => {
  console.log('\n=== FETCHING USERS ===');
  
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('✓ Connected to SQL Database');
    
    const result = await pool.request().query(`SELECT Id, Username, Name, Role, Email, UserID FROM dbo.Users`);
    
    const users = result.recordset;
    console.log(`✓ Query returned ${users.length} user(s)`);
    console.log('=== END FETCH USERS ===\n');
    
    res.json({ value: users });
  } catch (error) {
    console.error('\n✗ SQL Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint - queries Users table directly
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('\n=== LOGIN ATTEMPT ===');
  console.log('Received username:', username);
  console.log('Received password:', password ? '***' + password.slice(-2) : 'MISSING');
  console.log('Password length:', password?.length || 0);

  if (!username || !password) {
    console.log('ERROR: Username or password missing');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Create connection pool (reuses connections)
    const pool = await sql.connect(sqlConfig);
    console.log('✓ Connected to SQL Database');
    
    // First, get the actual column names from the Users table
    const columnsResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Users'
        ORDER BY ORDINAL_POSITION
      `);
    
    const columns = columnsResult.recordset.map(row => row.COLUMN_NAME);
    console.log('✓ Users table columns found:', columns);
    
    // Build SELECT query with actual column names
    const selectColumns = columns.join(', ');
    
    // Find username column (case-insensitive)
    const usernameCol = columns.find(col => 
      col.toLowerCase() === 'username' || 
      col.toLowerCase() === 'email' ||
      col.toLowerCase() === 'user_name'
    ) || columns[0]; // Fallback to first column
    
    console.log('✓ Using username column:', usernameCol);
    console.log('✓ Querying for username:', username);
    
    // Query Users table with actual column names
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`SELECT ${selectColumns} FROM dbo.Users WHERE [${usernameCol}] = @username`);

    const users = result.recordset;
    console.log('✓ Query returned', users.length, 'user(s)');
    
    if (users.length === 0) {
      console.log('✗ ERROR: No user found with username:', username);
      console.log('  Searched in column:', usernameCol);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('✓ User found:', {
      ...Object.keys(user).reduce((acc, key) => {
        if (key.toLowerCase().includes('password')) {
          acc[key] = '***HIDDEN***';
        } else {
          acc[key] = user[key];
        }
        return acc;
      }, {})
    });

    // Find password column (case-insensitive)
    const passwordCol = columns.find(col => 
      col.toLowerCase() === 'password' || 
      col.toLowerCase() === 'pwd'
    );
    
    if (!passwordCol) {
      console.log('✗ ERROR: Password column not found. Available columns:', columns);
      return res.status(500).json({ error: 'Password column not found in Users table' });
    }

    console.log('✓ Using password column:', passwordCol);
    console.log('✓ Stored password value:', user[passwordCol] ? '***' + String(user[passwordCol]).slice(-2) : 'NULL');
    console.log('✓ Stored password length:', user[passwordCol]?.length || 0);
    console.log('✓ Entered password length:', password.length);
    console.log('✓ Password match:', user[passwordCol] === password);

    // Verify password (plain text comparison - should be hashed in production)
    if (user[passwordCol] !== password) {
      console.log('✗ ERROR: Password mismatch');
      console.log('  Expected:', user[passwordCol]);
      console.log('  Received:', password);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✓ Password verified successfully');

    // Map columns to expected format (handle different naming conventions)
    const idCol = columns.find(col => 
      col.toLowerCase() === 'id' || 
      col.toLowerCase() === 'userid' ||
      col.toLowerCase() === 'user_id'
    );
    const nameCol = columns.find(col => 
      col.toLowerCase() === 'name' || 
      col.toLowerCase() === 'fullname' ||
      col.toLowerCase() === 'full_name'
    );
    const roleCol = columns.find(col => 
      col.toLowerCase() === 'role' || 
      col.toLowerCase() === 'userrole' ||
      col.toLowerCase() === 'user_role'
    );
    const emailCol = columns.find(col => 
      col.toLowerCase() === 'email' || 
      col.toLowerCase() === 'emailaddress' ||
      col.toLowerCase() === 'email_address'
    );

    // Return user without password
    const rawRole = roleCol ? user[roleCol] : 'employee';
    const normalizedRole = String(rawRole).toLowerCase().trim();
    
    const userResponse = {
      id: idCol ? user[idCol] : user[columns[0]], // Use first column as ID if no ID column found
      username: user[usernameCol] || username,
      name: nameCol ? user[nameCol] : user[usernameCol] || username,
      role: normalizedRole || 'employee',
      email: emailCol ? user[emailCol] : user[usernameCol] || username
    };
    
    console.log('✓ Raw role from DB:', rawRole);
    console.log('✓ Normalized role:', normalizedRole);
    console.log('✓ Login successful! Returning user:', { ...userResponse, password: '***HIDDEN***' });
    console.log('=== END LOGIN ===\n');
    
    res.json(userResponse);
  } catch (error) {
    console.error('\n✗ SQL Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', {
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName
    });
    console.log('=== END LOGIN (ERROR) ===\n');
    
    if (error.code === 'ELOGIN') {
      res.status(500).json({ 
        error: 'Database authentication failed',
        message: 'Please check SQL_USER and SQL_PASSWORD in .env file'
      });
    } else if (error.code === 'ETIMEOUT') {
      res.status(500).json({ 
        error: 'Database connection timeout',
        message: 'Please check SQL_SERVER and network connection'
      });
    } else {
      res.status(500).json({ 
        error: 'Database connection failed',
        message: error.message 
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Auth proxy server running on http://localhost:${PORT}`);
  console.log('Make sure SQL_USER, SQL_PASSWORD, SQL_SERVER, and SQL_DATABASE are set in .env');
});

