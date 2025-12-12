const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        await sql.connect(process.env.DATABASE_CONNECTION_STRING);
        
        const result = await sql.query(`SELECT Id, Username, Name, Role, Email, UserID FROM dbo.Users`);
        
        context.res = { status: 200, body: { value: result.recordset } };
    } catch (err) {
        context.res = { status: 500, body: err.message };
    }
};





