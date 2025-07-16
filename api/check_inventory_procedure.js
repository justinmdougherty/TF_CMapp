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

async function checkInventoryProcedure() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        const pool = await sql.connect(dbConfig);
        
        // Check usp_SaveInventoryItem procedure definition
        console.log('\n📋 usp_SaveInventoryItem Procedure Definition');
        console.log('=============================================');
        const procResult = await pool.request().query(`
            SELECT ROUTINE_DEFINITION
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_NAME = 'usp_SaveInventoryItem'
        `);
        
        if (procResult.recordset.length > 0) {
            const definition = procResult.recordset[0].ROUTINE_DEFINITION;
            console.log('Procedure Definition:');
            console.log(definition);
            
            // Extract parameters from the definition
            const paramMatches = definition.match(/@\w+\s+\w+(\(\d+\))?/g);
            if (paramMatches) {
                console.log('\n📋 Expected Parameters:');
                paramMatches.forEach((param, index) => {
                    console.log(`${index + 1}: ${param}`);
                });
            }
        }
        
        // Check what parameters the API might be sending
        console.log('\n🔍 Checking API endpoint for inventory creation...');
        
        // Look for inventory-related procedures
        console.log('\n📋 All Inventory-related Procedures');
        console.log('==================================');
        const allProcResult = await pool.request().query(`
            SELECT ROUTINE_NAME, ROUTINE_DEFINITION
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
            AND (ROUTINE_NAME LIKE '%Inventory%' OR ROUTINE_NAME LIKE '%Save%')
            ORDER BY ROUTINE_NAME
        `);
        
        allProcResult.recordset.forEach(proc => {
            console.log(`\n--- ${proc.ROUTINE_NAME} ---`);
            const definition = proc.ROUTINE_DEFINITION;
            const paramMatches = definition.match(/@\w+\s+\w+(\(\d+\))?/g);
            if (paramMatches) {
                console.log('Parameters:');
                paramMatches.forEach((param, index) => {
                    console.log(`  ${index + 1}: ${param}`);
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.originalError) {
            console.error('SQL Error:', error.originalError.message);
        }
    } finally {
        await sql.close();
    }
}

checkInventoryProcedure();
