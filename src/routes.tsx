import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveExperimentPage } from './pages/LiveExperimentPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ModelViewerPage } from './pages/ModelViewerPage';
import { ReportsPage } from './pages/ReportsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/live" element={<LiveExperimentPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/viewer" element={<ModelViewerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
