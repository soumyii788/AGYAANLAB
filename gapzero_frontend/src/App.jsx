import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { NewResearchPage } from './pages/NewResearchPage';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { SourcesPage } from './pages/SourcesPage';
import { IntelligenceDashboardPage } from './pages/IntelligenceDashboardPage';
import { FindingsExplorerPage } from './pages/FindingsExplorerPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalysesPage } from './pages/AnalysesPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Settings, HelpCircle, Activity } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading AGYAAN LAB..." />;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root & Public Landing Page */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
          </Route>

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* 9 Core Research Intelligence Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-research" element={<NewResearchPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/intelligence" element={<IntelligenceDashboardPage />} />
            <Route path="/findings" element={<FindingsExplorerPage />} />
            <Route path="/evidence" element={<EvidenceExplorerPage />} />
            <Route path="/evidence-explorer" element={<Navigate to="/evidence" replace />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* Additional Project & Exploration Routes */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/analyses" element={<AnalysesPage />} />

            <Route
              path="/activity"
              element={
                <PlaceholderPage
                  title="System Telemetry"
                  subtitle="Audit log of automated literature extractions and gap models."
                  icon={Activity}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Workspace Settings"
                  subtitle="Configure Groq AI keys, model selection, and token parameters."
                  icon={Settings}
                />
              }
            />
            <Route
              path="/docs"
              element={
                <PlaceholderPage
                  title="Documentation & Architecture"
                  subtitle="API documentation and negative-space intelligence methodology."
                  icon={HelpCircle}
                />
              }
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
