// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;

export const API_CONFIG = {
  // Use Railway backend URL in production, localhost in development
  BASE_URL: isDevelopment 
    ? 'http://localhost:3000' 
    : import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app',
  
  // API endpoints
  ENDPOINTS: {
    KDP_FORMATTER: {
      EXTRACT: '/api/kdp-formatter/extract',
      ENHANCE: '/api/kdp-formatter/enhance',
      FORMAT_PDF: '/api/kdp-formatter/format-pdf'
    }
  }
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 