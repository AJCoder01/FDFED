import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AppProvider } from './app/context/AppContext';
import { AppRoutes } from './app/routes/AppRoutes';
import { store } from './app/store';
import './index.css';

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
