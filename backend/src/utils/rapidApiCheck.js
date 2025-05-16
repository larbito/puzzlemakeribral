/**
 * Utility to check if the RapidAPI key is configured
 */
const fetch = require('node-fetch');

/**
 * Check if RapidAPI key is configured and valid
 * @returns {Promise<{configured: boolean, error: Error|null}>}
 */
async function checkRapidAPI() {
  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
    const RAPIDAPI_HOST = 'raster-to-svg-vector-conversion-api-jpg-png-to-svg.p.rapidapi.com';
    
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not set in environment');
      return {
        configured: false,
        error: new Error('API key not configured')
      };
    }
    
    // Make a simple check request to validate the API key
    console.log('Testing RapidAPI connection...');
    const response = await fetch('https://raster-to-svg-vector-conversion-api-jpg-png-to-svg.p.rapidapi.com/', {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log('RapidAPI key is valid');
    
    return {
      configured: true,
      error: null
    };
  } catch (error) {
    console.error('RapidAPI check failed:', error.message);
    
    return {
      configured: false,
      error
    };
  }
}

module.exports = {
  checkRapidAPI
}; 