import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Generate unique user ID for session tracking
if (!localStorage.getItem("prism_user_id")) {
  const id = crypto.randomUUID();
  localStorage.setItem("prism_user_id", id);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
