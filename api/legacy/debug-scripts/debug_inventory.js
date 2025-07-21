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

async function debugInventory() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('=== CHECKING INVENTORY ITEMS TABLE ===');
        
        // Check table structure
        const tableStructure = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'InventoryItems'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Table Structure:');
        console.table(tableStructure.recordset);
        
        // Check if any inventory items exist
        const itemCount = await pool.request().query('SELECT COUNT(*) as total_count FROM InventoryItems');
        console.log('\n=== INVENTORY ITEM COUNT ===');
        console.log('Total items:', itemCount.recordset[0].total_count);
        
        // Check active items
        const activeItems = await pool.request().query('SELECT COUNT(*) as active_count FROM InventoryItems WHERE is_active = 1');
        console.log('Active items:', activeItems.recordset[0].active_count);
        
        // Show sample items if any exist
        const sampleItems = await pool.request().query('SELECT TOP 5 * FROM InventoryItems');
        if (sampleItems.recordset.length > 0) {
            console.log('\n=== SAMPLE INVENTORY ITEMS ===');
            console.table(sampleItems.recordset);
        } else {
            console.log('\n=== NO INVENTORY ITEMS FOUND ===');
        }
        
        // Check programs table
        const programs = await pool.request().query('SELECT program_id, program_name FROM Programs WHERE is_active = 1');
        console.log('\n=== ACTIVE PROGRAMS ===');
        console.table(programs.recordset);
        
        await pool.close();
    } catch (error) {
        console.error('Database error:', error);
    }
}

debugInventory();
