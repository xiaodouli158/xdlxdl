import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';
// import { StreamingProvider } from './context/StreamingContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* <StreamingProvider> */}
        <App />
      {/* </StreamingProvider> */}
    </BrowserRouter>
  </React.StrictMode>
);