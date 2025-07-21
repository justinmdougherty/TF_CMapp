const sql = require('mssql');

// Database configuration
const dbConfig = {
    server: '127.0.0.1',
    database: 'H10CM',
    user: 'sa',
    password: '0)Password',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
    }
};

async function debugCartError() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        await sql.connect(dbConfig);
        console.log('✅ Connected to database');

        // Test 1: Check if the procedure exists and its parameters
        console.log('\n📋 Testing usp_SaveInventoryItem procedure signature...');
        const procedureCheck = await sql.query`
            SELECT 
                ROUTINE_NAME,
                PARAMETER_NAME,
                PARAMETER_MODE,
                DATA_TYPE,
                ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.PARAMETERS
            WHERE ROUTINE_NAME = 'usp_SaveInventoryItem'
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('Procedure Parameters:');
        procedureCheck.recordset.forEach(param => {
            console.log(`  ${param.ORDINAL_POSITION}: ${param.PARAMETER_NAME} (${param.DATA_TYPE}) - ${param.PARAMETER_MODE}`);
        });

        // Test 2: Try to call the procedure correctly
        console.log('\n🧪 Testing procedure call with correct parameters...');
        const testInventoryItem = {
            item_name: 'Test Item',
            part_number: 'TEST001',
            description: 'Test description',
            category: 'Test',
            unit_of_measure: 'Each',
            current_stock_level: 0,
            reorder_point: 5,
            max_stock_level: 100,
            supplier_info: 'Test Supplier',
            cost_per_unit: 10.50,
            location: 'Test Location',
            program_id: 1,
            created_by: 1
        };

        const request = new sql.Request();
        request.input('InventoryItemJson', sql.NVarChar, JSON.stringify(testInventoryItem));
        
        try {
            const result = await request.execute('usp_SaveInventoryItem');
            console.log('✅ Procedure executed successfully');
            console.log('Result:', result.recordset);
        } catch (procError) {
            console.log('❌ Procedure execution failed:', procError.message);
            console.log('Error details:', procError);
        }

        // Test 3: Test with multiple parameters (to reproduce the "too many arguments" error)
        console.log('\n🧪 Testing procedure call with multiple parameters (should fail)...');
        const badRequest = new sql.Request();
        badRequest.input('InventoryItemJson', sql.NVarChar, JSON.stringify(testInventoryItem));
        badRequest.input('extra_param', sql.Int, 123); // This should cause the error

        try {
            await badRequest.execute('usp_SaveInventoryItem');
            console.log('❌ This should have failed but didn\'t');
        } catch (badError) {
            console.log('✅ Expected error occurred:', badError.message);
        }

        // Test 4: Check what happens when the cart system creates orders
        console.log('\n🧪 Testing cart system workflow...');
        
        // First, let's see if there are any cart items
        const cartCheck = await sql.query`
            SELECT COUNT(*) as cart_count FROM CartItems WHERE user_id = 1
        `;
        console.log('Cart items for user 1:', cartCheck.recordset[0].cart_count);

        // Check if there are any test orders
        const orderCheck = await sql.query`
            SELECT COUNT(*) as order_count FROM Orders WHERE created_by = 1
        `;
        console.log('Orders for user 1:', orderCheck.recordset[0].order_count);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
        console.log('📦 Database connection closed');
    }
}

debugCartError();
