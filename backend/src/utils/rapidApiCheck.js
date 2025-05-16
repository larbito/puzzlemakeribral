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
    
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not set in environment');
      return {
        configured: false,
        error: new Error('API key not configured')
      };
    }
    
    // Make a simple ping to the API to verify key works
    const response = await fetch('https://vector-conversion.p.rapidapi.com/status', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'vector-conversion.p.rapidapi.com'
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