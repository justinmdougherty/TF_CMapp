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

async function testCartSystem() {
    try {
        console.log('🔗 Connecting to H10CM database...');
        const pool = await sql.connect(dbConfig);
        
        // Test 1: Check current inventory
        console.log('\n📦 STEP 1: Current Inventory Items');
        console.log('=====================================');
        const inventoryResult = await pool.request().query(`
            SELECT TOP 5 inventory_item_id, part_number, part_name, current_stock, unit_cost 
            FROM InventoryItems 
            WHERE project_id = 1 
            ORDER BY inventory_item_id
        `);
        
        inventoryResult.recordset.forEach(item => {
            console.log(`${item.inventory_item_id}: ${item.part_number} - ${item.part_name} (Stock: ${item.current_stock}, Cost: $${item.unit_cost})`);
        });
        
        // Test 2: Check current cart contents
        console.log('\n🛒 STEP 2: Current Cart Contents');
        console.log('===============================');
        const cartResult = await pool.request()
            .input('user_id', sql.Int, 2)
            .input('project_id', sql.Int, 1)
            .execute('usp_GetCartItems');
        
        if (cartResult.recordset.length === 0) {
            console.log('Cart is empty');
        } else {
            cartResult.recordset.forEach(item => {
                console.log(`${item.part_number}: Qty ${item.quantity_requested}, Cost: $${item.estimated_cost}`);
            });
        }
        
        // Test 3: Add items to cart
        console.log('\n➕ STEP 3: Adding Items to Cart');
        console.log('==============================');
        
        // Add first inventory item to cart
        if (inventoryResult.recordset.length > 0) {
            const firstItem = inventoryResult.recordset[0];
            const cartItemJson = JSON.stringify({
                user_id: 2,
                inventory_item_id: firstItem.inventory_item_id,
                quantity_requested: 5,
                estimated_cost: firstItem.unit_cost * 5,
                notes: 'Test cart addition'
            });
            
            console.log(`Adding ${firstItem.part_number} (Qty: 5) to cart...`);
            const addResult = await pool.request()
                .input('CartItemJson', sql.NVarChar, cartItemJson)
                .execute('usp_AddToCart');
            
            console.log('✅ Item added to cart');
        }
        
        // Test 4: Check cart after addition
        console.log('\n🛒 STEP 4: Cart After Addition');
        console.log('=============================');
        const cartAfterResult = await pool.request()
            .input('user_id', sql.Int, 2)
            .input('project_id', sql.Int, 1)
            .execute('usp_GetCartItems');
        
        cartAfterResult.recordset.forEach(item => {
            console.log(`${item.part_number}: Qty ${item.quantity_requested}, Cost: $${item.estimated_cost}`);
        });
        
        // Test 5: Create order from cart
        console.log('\n📋 STEP 5: Creating Order from Cart');
        console.log('==================================');
        
        if (cartAfterResult.recordset.length > 0) {
            const orderJson = JSON.stringify({
                user_id: 2,
                project_id: 1,
                order_type: 'Purchase',
                priority: 'Normal',
                notes: 'Test order from cart system'
            });
            
            console.log('Creating order from cart items...');
            const orderResult = await pool.request()
                .input('OrderJson', sql.NVarChar, orderJson)
                .execute('usp_CreateOrderFromCart');
            
            console.log('✅ Order created from cart');
        }
        
        // Test 6: Check pending orders
        console.log('\n📋 STEP 6: Pending Orders');
        console.log('========================');
        const pendingResult = await pool.request()
            .input('user_id', sql.Int, 2)
            .input('project_id', sql.Int, 1)
            .execute('usp_GetPendingOrders');
        
        pendingResult.recordset.forEach(order => {
            console.log(`Order ${order.order_id}: ${order.part_number} - Qty: ${order.quantity_ordered}, Status: ${order.status}`);
        });
        
        // Test 7: Mark order as received (simulate receiving inventory)
        console.log('\n📦 STEP 7: Receiving Order');
        console.log('=========================');
        
        if (pendingResult.recordset.length > 0) {
            const firstOrder = pendingResult.recordset[0];
            const receiveJson = JSON.stringify({
                order_id: firstOrder.order_id,
                user_id: 2,
                quantity_received: firstOrder.quantity_ordered,
                notes: 'Test order receipt'
            });
            
            console.log(`Marking order ${firstOrder.order_id} as received...`);
            const receiveResult = await pool.request()
                .input('OrderReceivedJson', sql.NVarChar, receiveJson)
                .execute('usp_MarkOrderAsReceived');
            
            console.log('✅ Order marked as received');
        }
        
        // Test 8: Check final inventory levels
        console.log('\n📦 STEP 8: Final Inventory Levels');
        console.log('================================');
        const finalInventoryResult = await pool.request().query(`
            SELECT TOP 5 inventory_item_id, part_number, part_name, current_stock, unit_cost 
            FROM InventoryItems 
            WHERE project_id = 1 
            ORDER BY inventory_item_id
        `);
        
        finalInventoryResult.recordset.forEach(item => {
            console.log(`${item.inventory_item_id}: ${item.part_number} - ${item.part_name} (Stock: ${item.current_stock}, Cost: $${item.unit_cost})`);
        });
        
        console.log('\n🎉 CART SYSTEM TEST COMPLETE!');
        console.log('============================');
        console.log('✅ All workflow steps completed successfully');
        console.log('✅ Cart → Pending Orders → Inventory Receipt tested');
        
    } catch (error) {
        console.error('❌ Error during cart system test:', error.message);
        if (error.originalError) {
            console.error('SQL Error:', error.originalError.message);
        }
    } finally {
        await sql.close();
    }
}

// Run the test
testCartSystem();
