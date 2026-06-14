import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Yeh import karein
import App from './App'; // Aapka App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* BrowserRouter ko yahan sabse upar hona chahiye */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);