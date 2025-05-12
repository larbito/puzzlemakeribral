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