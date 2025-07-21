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

async function comprehensiveDbCheck() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('=== COMPREHENSIVE DATABASE CHECK ===');
        
        // Check if database exists and is accessible
        const dbInfo = await pool.request().query(`
            SELECT 
                DB_NAME() as current_database,
                @@VERSION as sql_version,
                GETDATE() as current_datetime
        `);
        console.log('\n=== DATABASE INFO ===');
        console.table(dbInfo.recordset);
        
        // Check if InventoryItems table exists
        const tableExists = await pool.request().query(`
            SELECT COUNT(*) as table_exists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'InventoryItems'
        `);
        console.log('\n=== TABLE EXISTENCE CHECK ===');
        console.log('InventoryItems table exists:', tableExists.recordset[0].table_exists > 0);
        
        if (tableExists.recordset[0].table_exists === 0) {
            console.log('❌ CRITICAL: InventoryItems table does not exist!');
            console.log('You need to run the h10cm.sql script to create the database schema.');
            return;
        }
        
        // Check table structure
        const tableStructure = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'InventoryItems'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('\n=== INVENTORY ITEMS TABLE STRUCTURE ===');
        console.table(tableStructure.recordset);
        
        // Check if program_id column exists
        const programIdExists = tableStructure.recordset.find(col => col.COLUMN_NAME === 'program_id');
        console.log('\n=== PROGRAM_ID COLUMN CHECK ===');
        console.log('program_id column exists:', !!programIdExists);
        
        if (!programIdExists) {
            console.log('❌ CRITICAL: program_id column is missing from InventoryItems table!');
            console.log('You need to add the program_id column to the InventoryItems table.');
        }
        
        // Check inventory data
        const itemCount = await pool.request().query('SELECT COUNT(*) as total_count FROM InventoryItems');
        console.log('\n=== INVENTORY DATA CHECK ===');
        console.log('Total inventory items:', itemCount.recordset[0].total_count);
        
        if (itemCount.recordset[0].total_count > 0) {
            // Show sample data
            const sampleData = await pool.request().query('SELECT TOP 3 * FROM InventoryItems');
            console.log('\n=== SAMPLE INVENTORY DATA ===');
            console.table(sampleData.recordset);
        }
        
        // Check Programs table
        const programsCheck = await pool.request().query(`
            SELECT COUNT(*) as table_exists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Programs'
        `);
        
        if (programsCheck.recordset[0].table_exists > 0) {
            const programs = await pool.request().query('SELECT program_id, program_name, is_active FROM Programs');
            console.log('\n=== PROGRAMS DATA ===');
            console.table(programs.recordset);
        } else {
            console.log('\n❌ Programs table does not exist!');
        }
        
        // Check stored procedures
        const procedures = await pool.request().query(`
            SELECT name, create_date, modify_date
            FROM sys.objects 
            WHERE type = 'P' AND name LIKE '%Inventory%'
            ORDER BY name
        `);
        console.log('\n=== INVENTORY-RELATED STORED PROCEDURES ===');
        console.table(procedures.recordset);
        
        await pool.close();
    } catch (error) {
        console.error('Database error:', error);
        
        if (error.message.includes('Invalid object name')) {
            console.log('\n❌ SOLUTION: Run the h10cm.sql script to create the database schema.');
        } else if (error.message.includes('Cannot open database')) {
            console.log('\n❌ SOLUTION: Ensure the H10CM database exists and you have proper permissions.');
        }
    }
}

comprehensiveDbCheck();
