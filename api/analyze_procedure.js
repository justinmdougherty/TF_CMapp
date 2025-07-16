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

async function analyzeProcedure() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        const pool = await sql.connect(dbConfig);
        
        // Get the complete procedure definition
        console.log('\n📋 usp_SaveInventoryItem Complete Definition');
        console.log('===========================================');
        
        const procedureDefinition = await pool.request().query(`
            SELECT 
                m.definition
            FROM sys.sql_modules m
            INNER JOIN sys.objects o ON m.object_id = o.object_id
            WHERE o.name = 'usp_SaveInventoryItem'
        `);
        
        if (procedureDefinition.recordset.length > 0) {
            console.log('Stored Procedure Definition:');
            console.log(procedureDefinition.recordset[0].definition);
        } else {
            console.log('❌ Procedure not found');
        }
        
        // Check if procedure exists and what it does
        console.log('\n🔍 Checking procedure existence and parameters...');
        const procCheck = await pool.request().query(`
            SELECT 
                p.name AS procedure_name,
                par.name AS parameter_name,
                t.name AS data_type,
                par.max_length,
                par.is_output
            FROM sys.procedures p
            LEFT JOIN sys.parameters par ON p.object_id = par.object_id
            LEFT JOIN sys.types t ON par.user_type_id = t.user_type_id
            WHERE p.name = 'usp_SaveInventoryItem'
            ORDER BY par.parameter_id
        `);
        
        if (procCheck.recordset.length > 0) {
            console.log('Parameters found:');
            procCheck.recordset.forEach((param, index) => {
                if (param.parameter_name) {
                    console.log(`  ${index + 1}. ${param.parameter_name} (${param.data_type}${param.max_length ? '(' + param.max_length + ')' : ''}) ${param.is_output ? '- OUTPUT' : ''}`);
                }
            });
        } else {
            console.log('❌ No parameters found or procedure doesn\'t exist');
        }
        
        // Let's also check what inventory-related procedures exist
        console.log('\n📋 All Inventory-Related Procedures');
        console.log('===================================');
        const allProcs = await pool.request().query(`
            SELECT name 
            FROM sys.procedures 
            WHERE name LIKE '%inventory%' OR name LIKE '%Inventory%'
            ORDER BY name
        `);
        
        allProcs.recordset.forEach(proc => {
            console.log(`  - ${proc.name}`);
        });
        
        // Test calling the procedure with minimal data
        console.log('\n🧪 Testing procedure with minimal JSON...');
        const testJson = JSON.stringify({
            item_name: 'Test Item',
            unit_of_measure: 'Each',
            program_id: 1,
            created_by: 1,
            current_stock_level: 0
        });
        
        try {
            const testResult = await pool.request()
                .input('InventoryItemJson', sql.NVarChar, testJson)
                .execute('usp_SaveInventoryItem');
            
            console.log('✅ Procedure executed successfully');
            console.log('Result:', testResult.recordset);
        } catch (error) {
            console.log('❌ Procedure failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
    }
}

analyzeProcedure();
