import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SerialProvider } from '../context/SerialContext';
import { ExperimentProvider } from '../context/ExperimentContext';
import { AppRoutes } from '../routes';

const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <SerialProvider>
        <ExperimentProvider>
          <AppRoutes />
        </ExperimentProvider>
      </SerialProvider>
    </MemoryRouter>
  );
};

describe('THERMALAB User Interface & Navigation', () => {
  it('renders the Main Dashboard by default with brand title and disconnected indicator', () => {
    renderApp('/');
    expect(screen.getByText(/THERMALAB Control Center/i)).toBeInTheDocument();
    expect(screen.getByText(/DISCONNECTED/i)).toBeInTheDocument();
  });

  it('navigates to Live Experiment dashboard via sidebar link', () => {
    renderApp('/');
    const liveLink = screen.getByRole('link', { name: /LIVE EXPERIMENT/i });
    fireEvent.click(liveLink);
    expect(screen.getByText(/Live Experiment Acquisition/i)).toBeInTheDocument();
  });

  it('navigates to Comparative Analysis dashboard and shows 3-graph header', () => {
    renderApp('/analysis');
    expect(screen.getByText(/Comparative Thermal Response Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/3-GRAPH LAYOUT/i)).toBeInTheDocument();
  });

  it('navigates to 3D Model Viewer dashboard', () => {
    renderApp('/viewer');
    expect(screen.getByText(/3D Physical Apparatus Inspection/i)).toBeInTheDocument();
  });

  it('navigates to Reports and Project Documentation dashboard', () => {
    renderApp('/reports');
    expect(screen.getByText(/Scientific Reports & Project Documentation/i)).toBeInTheDocument();
  });

  it('activates Demo Mode and renders the explicit DEMO DATA disclaimer banner', async () => {
    renderApp('/');
    const demoButton = screen.getByRole('button', { name: /Demo Mode/i });
    fireEvent.click(demoButton);

    // Verify mandatory scientific disclaimer
    const demoBanner = await screen.findAllByText(/DEMO DATA — NOT REAL SENSOR MEASUREMENTS/i);
    expect(demoBanner.length).toBeGreaterThan(0);
  });
});
