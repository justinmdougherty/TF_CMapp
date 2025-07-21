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

async function checkSchema() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        const pool = await sql.connect(dbConfig);
        
        // Check InventoryItems table schema
        console.log('\n📋 InventoryItems Table Schema');
        console.log('=============================');
        const schemaResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'InventoryItems'
            ORDER BY ORDINAL_POSITION
        `);
        
        schemaResult.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Check actual data
        console.log('\n📦 Sample Inventory Data');
        console.log('=======================');
        const dataResult = await pool.request().query(`
            SELECT TOP 3 * FROM InventoryItems WHERE project_id = 1
        `);
        
        if (dataResult.recordset.length > 0) {
            console.log('First record:', JSON.stringify(dataResult.recordset[0], null, 2));
        }
        
        // Check CartItems table schema
        console.log('\n🛒 CartItems Table Schema');
        console.log('========================');
        const cartSchemaResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CartItems'
            ORDER BY ORDINAL_POSITION
        `);
        
        cartSchemaResult.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Check Orders table schema
        console.log('\n📋 Orders Table Schema');
        console.log('======================');
        const ordersSchemaResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Orders'
            ORDER BY ORDINAL_POSITION
        `);
        
        ordersSchemaResult.recordset.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
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

checkSchema();
