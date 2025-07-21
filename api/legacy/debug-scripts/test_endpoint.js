const axios = require('axios');

async function testInventoryEndpoint() {
    try {
        console.log('=== TESTING INVENTORY API ENDPOINT ===');
        
        // Test the inventory endpoint
        const response = await axios.get('http://127.0.0.1:3000/api/inventory-items', {
            headers: {
                'x-arr-clientcert': 'development-fallback'
            }
        });
        
        console.log('API Response Status:', response.status);
        console.log('Number of items returned:', response.data.length);
        
        if (response.data.length > 0) {
            console.log('\n=== FIRST ITEM FROM API ===');
            console.log(JSON.stringify(response.data[0], null, 2));
            
            // Check if program_id is now included
            const hasPropertyId = response.data[0].hasOwnProperty('program_id');
            console.log('\n=== PROGRAM_ID CHECK ===');
            console.log('program_id field present:', hasPropertyId);
            
            if (hasPropertyId) {
                console.log('✅ SUCCESS: program_id field is now included in the response');
                console.log('Program filtering should now work correctly');
            } else {
                console.log('❌ ISSUE: program_id field is still missing');
            }
            
            console.log('\n=== ALL ITEMS SUMMARY ===');
            response.data.forEach((item, index) => {
                console.log(`${index + 1}. ${item.item_name} (Program ID: ${item.program_id || 'MISSING'})`);
            });
        } else {
            console.log('❌ No items returned - there may still be filtering issues');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ API server not running. Starting the server first...');
            console.log('Run: cd "d:\\Web Development\\H10CM\\api" && npm run dev');
        } else {
            console.error('API Error:', error.response ? error.response.data : error.message);
        }
    }
}

testInventoryEndpoint();
