import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Sparkles, Layers, FileText, Activity, Settings, HelpCircle } from 'lucide-react';

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

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route
              path="/analyses"
              element={
                <PlaceholderPage
                  title="Negative Space Gap Analyses"
                  subtitle="Algorithmic scan history, unaddressed hypotheses, and contradictory findings."
                  icon={Sparkles}
                />
              }
            />
            <Route
              path="/sources"
              element={
                <PlaceholderPage
                  title="Cross-Domain Literature Repository"
                  subtitle="Indexed academic papers, preprints, and clinical trial datasets."
                  icon={Layers}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <PlaceholderPage
                  title="Intelligence Reports"
                  subtitle="Peer-ready publications synthesized from identified research blindspots."
                  icon={FileText}
                />
              }
            />
            <Route
              path="/activity"
              element={
                <PlaceholderPage
                  title="Platform Activity & Audit Logs"
                  subtitle="Immutable record of user actions and AI gap extractions."
                  icon={Activity}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Workspace Settings"
                  subtitle="Configure organization tokens, JWT lifetimes, and access permissions."
                  icon={Settings}
                />
              }
            />
            <Route
              path="/docs"
              element={
                <PlaceholderPage
                  title="API Documentation & Architecture"
                  subtitle="Technical specifications for integrating external data pipelines."
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
