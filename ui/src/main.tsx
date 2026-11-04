import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadDemoDb } from './data/demoDb';

loadDemoDb();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
