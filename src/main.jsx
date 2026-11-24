import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/nav.css';

/* Lets CSS hide [data-reveal] elements only when JS is running. */
document.documentElement.classList.add('js');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
