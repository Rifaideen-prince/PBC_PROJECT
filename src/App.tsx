import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SerialProvider } from './context/SerialContext';
import { ExperimentProvider } from './context/ExperimentContext';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SerialProvider>
        <ExperimentProvider>
          <AppRoutes />
        </ExperimentProvider>
      </SerialProvider>
    </BrowserRouter>
  );
};

export default App;
