import ReactDOM from 'react-dom/client'
import App from './App'
import React from 'react'
import './index.css' // Make sure this file exists and imports Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)