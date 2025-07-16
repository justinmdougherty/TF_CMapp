const sql = require('mssql');

const dbConfig = {
    user: "sa",
    password: "0)Password",
    server: "127.0.0.1",
    database: "H10CM",
    port: 1433,
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    }
};

async function checkProcedures() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        const pool = await sql.connect(dbConfig);
        
        // Check stored procedures
        console.log('\n📋 Cart-related Stored Procedures');
        console.log('=================================');
        const procResult = await pool.request().query(`
            SELECT ROUTINE_NAME, ROUTINE_DEFINITION
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_NAME LIKE '%Cart%'
            ORDER BY ROUTINE_NAME
        `);
        
        procResult.recordset.forEach(proc => {
            console.log(`Procedure: ${proc.ROUTINE_NAME}`);
            console.log('Parameters:');
            // Extract parameter info from definition
            const definition = proc.ROUTINE_DEFINITION;
            const paramMatch = definition.match(/@\w+\s+\w+/g);
            if (paramMatch) {
                paramMatch.forEach(param => console.log(`  ${param}`));
            }
            console.log('---');
        });
        
        // Check if there are any cart items
        console.log('\n🛒 Current Cart Items');
        console.log('====================');
        const cartCheck = await pool.request().query(`
            SELECT COUNT(*) as cart_count FROM CartItems
        `);
        console.log(`Total cart items: ${cartCheck.recordset[0].cart_count}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.originalError) {
            console.error('SQL Error:', error.originalError.message);
        }
    } finally {
        await sql.close();
    }
}

checkProcedures();
