// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts — self-hosted via @fontsource
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';           // ← display font
import '@fontsource-variable/jetbrains-mono';

import './styles/theme.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);