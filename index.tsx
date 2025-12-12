// PARA FORÇAR UMA NOVA VERSÃO: Altere o número da versão abaixo (ex: 71 -> 72)
// console.log('App Version: 78 - Auto-Update Service Worker');

import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { ErrorProvider } from './src/contexts/ErrorContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorProvider>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorProvider>
  </React.StrictMode>
);