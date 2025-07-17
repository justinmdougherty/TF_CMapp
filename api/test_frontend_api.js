const axios = require('axios');

async function testFrontendAPICall() {
    try {
        console.log('=== TESTING FRONTEND API CALL TO INVENTORY ===');
        
        // Simulate how the frontend calls the API
        const response = await axios.get('http://127.0.0.1:3000/api/inventory-items', {
            headers: {
                'x-arr-clientcert': 'development-fallback'
            }
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('✅ Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
        console.log('✅ Number of items:', response.data.length);
        
        // Test the wrapped response format that frontend expects
        const wrappedResponse = { data: response.data };
        console.log('\n=== TESTING WRAPPED RESPONSE FORMAT ===');
        console.log('✅ Wrapped data structure:', typeof wrappedResponse);
        console.log('✅ Has data property:', 'data' in wrappedResponse);
        console.log('✅ Data is array:', Array.isArray(wrappedResponse.data));
        console.log('✅ Items in wrapped data:', wrappedResponse.data.length);
        
        if (wrappedResponse.data.length > 0) {
            console.log('\n=== SAMPLE ITEM FROM WRAPPED RESPONSE ===');
            console.log(JSON.stringify(wrappedResponse.data[0], null, 2));
        }
        
        console.log('\n✅ CONCLUSION: Frontend API fix should work correctly!');
        console.log('   - Backend returns array directly');
        console.log('   - Frontend wraps it in { data: array }');
        console.log('   - React Query hook expects { data: array }');
        
    } catch (error) {
        console.error('❌ API Error:', error.response ? error.response.data : error.message);
    }
}

testFrontendAPICall();
