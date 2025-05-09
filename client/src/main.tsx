import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

console.log('Application starting...');

const root = document.getElementById('root');
console.log('Root element found:', root);

if (root) {
  ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  console.log('App rendered successfully');
} else {
  console.error('Root element not found');
} 