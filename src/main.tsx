import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { LanguageProvider } from './i18n';
import { BirthdayCelebration } from './components/layout/BirthdayCelebration';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ContentProvider>
        <LanguageProvider>
          <App />
          <BirthdayCelebration />
        </LanguageProvider>
      </ContentProvider>
    </AuthProvider>
  </React.StrictMode>,
);
