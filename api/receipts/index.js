const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        await sql.connect(process.env.DATABASE_CONNECTION_STRING);
        
        const result = await sql.query(`SELECT * FROM dbo.Receipts ORDER BY TransactionDate DESC`);
        
        // Clean up string fields that might have extra quotes
        const cleanedReceipts = result.recordset.map(receipt => {
            const cleaned = { ...receipt };
            if (cleaned.Status && typeof cleaned.Status === 'string') {
                cleaned.Status = cleaned.Status.replace(/^["']|["']$/g, '').trim();
            }
            if (cleaned.ApprovedBy && typeof cleaned.ApprovedBy === 'string') {
                cleaned.ApprovedBy = cleaned.ApprovedBy.replace(/^["']|["']$/g, '').trim();
            }
            if (cleaned.EmployeeName && typeof cleaned.EmployeeName === 'string') {
                cleaned.EmployeeName = cleaned.EmployeeName.replace(/^["']|["']$/g, '').trim();
            }
            return cleaned;
        });
        
        context.res = { status: 200, body: { value: cleanedReceipts } };
    } catch (err) {
        context.log.error("SQL Error", err);
        context.res = { status: 500, body: "Database connection failed: " + err.message };
    }
};





