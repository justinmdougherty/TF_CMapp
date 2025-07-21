// Test script to reproduce the exact error from the API
const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:3000';

async function testCartAddAPI() {
    try {
        console.log('🧪 Testing Cart Add API Endpoint...');
        
        // Test data that would cause the error
        const cartItem = {
            inventory_item_id: 1,
            quantity_requested: 3,
            estimated_cost: 25.50,
            notes: 'Test item'
        };
        
        console.log('Sending POST request to /api/cart/add...');
        console.log('Data:', JSON.stringify(cartItem, null, 2));
        
        const response = await axios.post(`${API_BASE_URL}/api/cart/add`, cartItem, {
            headers: {
                'Content-Type': 'application/json',
                'x-arr-clientcert': 'development-fallback'
            }
        });
        
        console.log('✅ Success Response:', response.data);
        
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', error.response?.data);
        console.error('Full Error:', error.message);
        
        // If it's the specific error we're looking for
        if (error.response?.data?.error?.includes('usp_SaveInventoryItem has too many arguments')) {
            console.log('🎯 FOUND THE ERROR! This is the exact issue we need to fix.');
        }
    }
}

async function testInventoryCreateAPI() {
    try {
        console.log('\n🧪 Testing Inventory Create API Endpoint...');
        
        // Test data that would cause the error
        const inventoryItem = {
            item_name: 'Test Item',
            part_number: 'TEST-001',
            description: 'Test description',
            category: 'Test Category',
            unit_of_measure: 'Each',
            current_stock_level: 0,
            reorder_point: 5,
            max_stock_level: 100,
            supplier_info: 'Test Supplier',
            cost_per_unit: 10.50,
            location: 'Test Location'
        };
        
        console.log('Sending POST request to /api/inventory-items...');
        console.log('Data:', JSON.stringify(inventoryItem, null, 2));
        
        const response = await axios.post(`${API_BASE_URL}/api/inventory-items`, inventoryItem, {
            headers: {
                'Content-Type': 'application/json',
                'x-arr-clientcert': 'development-fallback'
            }
        });
        
        console.log('✅ Success Response:', response.data);
        
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', error.response?.data);
        console.error('Full Error:', error.message);
        
        // If it's the specific error we're looking for
        if (error.response?.data?.error?.includes('usp_SaveInventoryItem has too many arguments')) {
            console.log('🎯 FOUND THE ERROR! This is the exact issue we need to fix.');
        }
    }
}

async function runTests() {
    console.log('🚀 Starting API Error Reproduction Tests...');
    await testCartAddAPI();
    await testInventoryCreateAPI();
    console.log('✅ Tests completed!');
}

runTests();
