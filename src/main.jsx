import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';
// import { StreamingProvider } from './context/StreamingContext';

// Add error handling for root container
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Failed to find the root element. Make sure there is a div with id="root" in your HTML file.');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          {/* <StreamingProvider> */}
            <App />
          {/* </StreamingProvider> */}
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Failed to render React app:', error);
  }
}