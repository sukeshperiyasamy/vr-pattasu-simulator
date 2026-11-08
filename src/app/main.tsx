import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, SceneBoundary } from './App';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');

createRoot(root).render(
  <StrictMode>
    <SceneBoundary>
      <App />
    </SceneBoundary>
  </StrictMode>,
);
