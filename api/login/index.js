const sql = require('mssql');

module.exports = async function (context, req) {
    const { username, password } = req.body;
    
    if (!username || !password) {
        context.res = { status: 400, body: { error: 'Username and password are required' } };
        return;
    }
    
    try {
        await sql.connect(process.env.DATABASE_CONNECTION_STRING);
        
        const request = new sql.Request();
        request.input('username', sql.NVarChar, username);
        
        const result = await request.query(`SELECT * FROM dbo.Users WHERE Username = @username`);
        
        const user = result.recordset[0];
        
        if (!user || user.Password !== password) {
            context.res = { status: 401, body: { error: "Invalid credentials" } };
            return;
        }
        
        // Map to expected format
        const userResponse = {
            id: user.UserID || user.UserId,
            username: user.Username || username,
            name: user.Name || user.FullName || username,
            role: (user.Role || 'employee').toLowerCase(),
            email: user.Email || user.email || username
        };
        
        context.res = { status: 200, body: userResponse };
    } catch (err) {
        context.log.error("Login Error", err);
        context.res = { status: 500, body: { error: err.message } };
    }
};





