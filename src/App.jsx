import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './app/context/AppContext';
import { AppRoutes } from './app/routes/AppRoutes';
import './index.css';

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
