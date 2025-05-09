// Simple Node.js HTTP server for healthchecks
const http = require('http');

// Create a server that responds with "healthy" to any request
const server = http.createServer((req, res) => {
  console.log(`Health check request received: ${req.method} ${req.url}`);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('healthy\n');
});

// Listen on the specified port
const PORT = process.env.HEALTH_PORT || 8080;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Log any errors
server.on('error', (error) => {
  console.error('Health check server error:', error);
});

// Keep the server running
process.on('SIGINT', () => {
  console.log('Health check server shutting down');
  server.close();
  process.exit(0);
}); 