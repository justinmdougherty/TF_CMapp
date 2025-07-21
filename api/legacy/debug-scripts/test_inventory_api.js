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

async function testInventoryAPI() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('=== TESTING INVENTORY API QUERY ===');
        
        // Test the exact query from the API endpoint
        const query = `
            SELECT ii.inventory_item_id, ii.item_name, ii.part_number, 
                   ii.description, ii.category, ii.unit_of_measure, ii.current_stock_level,
                   ii.reorder_point, ii.cost_per_unit, ii.location, ii.is_active,
                   ii.supplier_info, ii.max_stock_level, ii.date_created, ii.last_modified,
                   u.display_name as created_by_name
            FROM InventoryItems ii
            LEFT JOIN Users u ON ii.created_by = u.user_id
            WHERE ii.is_active = 1
            ORDER BY ii.item_name
        `;
        
        const result = await pool.request().query(query);
        console.log('Query executed successfully');
        console.log('Number of items returned:', result.recordset.length);
        
        if (result.recordset.length > 0) {
            console.log('\n=== FIRST ITEM ===');
            console.log(JSON.stringify(result.recordset[0], null, 2));
            
            console.log('\n=== ALL ITEMS SUMMARY ===');
            result.recordset.forEach((item, index) => {
                console.log(`${index + 1}. ${item.item_name} (Program ID: ${item.program_id || 'NOT SET'})`);
            });
        }
        
        // Check user authentication query
        console.log('\n=== TESTING USER AUTHENTICATION ===');
        const certSubject = "CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US";
        
        const userResult = await pool.request()
            .input('certificate_subject', sql.NVarChar, certSubject)
            .query(`
                SELECT u.user_id, u.user_name, u.display_name, u.is_system_admin,
                       JSON_QUERY((
                           SELECT pa.program_id, pa.access_level, p.program_name, p.program_code
                           FROM ProgramAccess pa 
                           JOIN Programs p ON pa.program_id = p.program_id
                           WHERE pa.user_id = u.user_id AND pa.is_active = 1
                           FOR JSON PATH
                       )) as program_access
                FROM Users u
                WHERE u.certificate_subject = @certificate_subject AND u.is_active = 1
            `);
            
        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            console.log('User found:', user.display_name);
            console.log('Is system admin:', user.is_system_admin);
            console.log('Program access:', user.program_access);
            
            if (user.program_access) {
                const programAccess = JSON.parse(user.program_access);
                console.log('Accessible programs:', programAccess.map(p => p.program_id));
            }
        } else {
            console.log('User not found!');
        }
        
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

testInventoryAPI();
