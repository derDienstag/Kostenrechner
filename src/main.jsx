/**
 * Application entry point.
 *
 * Mounts the root React component into the #root container.
 * Loads global stylesheet so design tokens (CSS variables) and
 * shared component styles are available everywhere.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
