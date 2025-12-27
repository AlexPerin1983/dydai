// PARA FORÇAR UMA NOVA VERSÃO: Altere o número da versão abaixo (ex: 71 -> 72)
// console.log('App Version: 79 - Estoque Público');

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { ErrorProvider } from './src/contexts/ErrorContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Lazy load da página pública
const EstoquePublicoView = lazy(() => import('./components/views/EstoquePublicoView'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Verificar se é uma consulta pública de estoque
const urlParams = new URLSearchParams(window.location.search);
const isPublicEstoque = urlParams.has('qr') || urlParams.has('code');
const pathname = window.location.pathname;

// Se for consulta pública de estoque (ex: ?qr=PBR-XXX ou /consulta?qr=PBR-XXX)
const isEstoquePublico = isPublicEstoque && (pathname === '/' || pathname === '/consulta' || pathname.includes('estoque'));

const root = ReactDOM.createRoot(rootElement);

if (isEstoquePublico) {
  // Renderizar página pública (sem necessidade de login)
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white'
          }}>
            <div>Carregando...</div>
          </div>
        }>
          <EstoquePublicoView />
        </Suspense>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  // Renderizar app normal (com autenticação)
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
}