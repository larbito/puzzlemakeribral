/**
 * Configuration for the application
 */

// App configuration

// This flag turns on or off debug features
export const DEBUG_MODE = true;

// App version to display in console/debug elements
export const APP_VERSION = "v1.0.2 - CORS Proxy Fix";

// Debug configuration
export const DEBUG_CONFIG = {
  showDebugBanner: true,
  logButtonClicks: true,
  logNetworkRequests: true,
  logLevel: "verbose" // 'error', 'warn', 'info', 'verbose'
};

// Log the config on import
console.log("=== App Config Loaded ===");
console.log("Debug Mode:", DEBUG_MODE);
console.log("App Version:", APP_VERSION);
console.log("Debug Configuration:", DEBUG_CONFIG);

// API base URL
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://puzzlemakeribral-production.up.railway.app'
  : 'http://localhost:3000';

// Export other configuration as needed
export const APP_CONFIG = {
  // Maximum file upload size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // Supported file types for image uploads
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Default DPI for printing
  DEFAULT_DPI: 300
}; 