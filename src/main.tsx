import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

if (import.meta.env.DEV) {
  const notice = document.createElement('div');
  notice.textContent = 'AMBIENTE LOCAL DE TESTES — dados salvos apenas neste navegador. Sem conexão ao banco online.';
  notice.style.cssText = 'background:#fef3c7;color:#78350f;padding:8px;text-align:center;font:14px sans-serif';
  document.body.prepend(notice);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
