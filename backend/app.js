const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory (for generated PDFs)
app.use('/books', express.static(path.join(__dirname, 'public/books')));

// Routes
app.use('/api/kdp-formatter', require('./src/routes/kdp-formatter')); 