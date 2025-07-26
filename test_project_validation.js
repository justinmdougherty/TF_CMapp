// Test script to verify project ID validation fix
const axios = require('axios');

async function testProjectValidation() {
    const API_BASE = 'http://localhost:3000';
    
    console.log('🧪 Testing Project ID validation...');
    
    // Test cases
    const testCases = [
        {
            description: 'Malformed URL with :12',
            url: `${API_BASE}/api/projects/:12`,
            expectedStatus: 400,
            expectedMessage: 'Invalid project ID format'
        },
        {
            description: 'Non-numeric ID',
            url: `${API_BASE}/api/projects/abc`,
            expectedStatus: 400,
            expectedMessage: 'Invalid project ID'
        },
        {
            description: 'Negative ID',
            url: `${API_BASE}/api/projects/-1`,
            expectedStatus: 400,
            expectedMessage: 'Invalid project ID'
        },
        {
            description: 'Zero ID',
            url: `${API_BASE}/api/projects/0`,
            expectedStatus: 400,
            expectedMessage: 'Invalid project ID'
        },
        {
            description: 'Valid ID (may fail due to auth but should pass validation)',
            url: `${API_BASE}/api/projects/12`,
            expectedStatus: [200, 401, 404], // Could be any of these
            expectedMessage: null // Don't check message for valid cases
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`\n📋 Testing: ${testCase.description}`);
            console.log(`   URL: ${testCase.url}`);
            
            const response = await axios.get(testCase.url, {
                headers: {
                    'x-arr-clientcert': 'development-fallback'
                },
                validateStatus: () => true // Don't throw on error status
            });
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Response:`, JSON.stringify(response.data, null, 2));
            
            // Check if status matches expected
            const statusMatches = Array.isArray(testCase.expectedStatus) 
                ? testCase.expectedStatus.includes(response.status)
                : response.status === testCase.expectedStatus;
                
            if (statusMatches) {
                console.log(`   ✅ Status check passed`);
            } else {
                console.log(`   ❌ Status check failed - expected ${testCase.expectedStatus}, got ${response.status}`);
            }
            
            // Check message if specified
            if (testCase.expectedMessage && response.data.error) {
                if (response.data.error.includes(testCase.expectedMessage)) {
                    console.log(`   ✅ Message check passed`);
                } else {
                    console.log(`   ❌ Message check failed - expected "${testCase.expectedMessage}", got "${response.data.error}"`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Request failed:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.log('   💡 Make sure the API server is running on port 3000');
                break;
            }
        }
    }
}

// Run the test if the API server is accessible
testProjectValidation().catch(console.error);
