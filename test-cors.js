// Test script for the CORS configuration of the backend
const fetch = require('node-fetch');

// Configuration
const BACKEND_URL = 'https://puzzle-craft-forge-production.up.railway.app';
const ENDPOINTS = [
  '/health',
  '/api/vectorize-test',
  '/api/vectorize/direct',
  '/api/vectorize'
];

async function testCORS() {
  console.log('Testing CORS configuration for backend endpoints...');
  
  for (const endpoint of ENDPOINTS) {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`\nTesting ${url}`);
    
    try {
      // First, try an OPTIONS request to test preflight
      const optionsResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
          'Origin': 'https://test-cors-client.example.com'
        }
      });
      
      console.log(`OPTIONS status: ${optionsResponse.status}`);
      
      // Check CORS headers
      const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers',
        'Access-Control-Max-Age'
      ];
      
      console.log('CORS Headers:');
      for (const header of corsHeaders) {
        const value = optionsResponse.headers.get(header);
        console.log(`  ${header}: ${value || 'not set'}`);
      }
      
      // Now try a GET request to see if it works
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Origin': 'https://test-cors-client.example.com'
        }
      });
      
      console.log(`GET status: ${getResponse.status}`);
      console.log(`Access-Control-Allow-Origin: ${getResponse.headers.get('Access-Control-Allow-Origin') || 'not set'}`);
      
      // Try to get response content
      let responseData;
      const contentType = getResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await getResponse.json();
        console.log('Response (JSON):', JSON.stringify(responseData, null, 2).substring(0, 200) + '...');
      } else {
        responseData = await getResponse.text();
        console.log('Response (text):', responseData.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error.message);
    }
  }
}

// Run the tests
testCORS(); 