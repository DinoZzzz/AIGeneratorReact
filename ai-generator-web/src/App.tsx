import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { queryClient } from './lib/queryClient';

// Lazy load all page components
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const WaterMethodForm = lazy(() => import('./pages/WaterMethodForm').then(m => ({ default: m.WaterMethodForm })));
const AirMethodForm = lazy(() => import('./pages/AirMethodForm').then(m => ({ default: m.AirMethodForm })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const CustomerForm = lazy(() => import('./pages/CustomerForm').then(m => ({ default: m.CustomerForm })));
const Constructions = lazy(() => import('./pages/Constructions').then(m => ({ default: m.Constructions })));
const ConstructionForm = lazy(() => import('./pages/ConstructionForm').then(m => ({ default: m.ConstructionForm })));
const ConstructionReports = lazy(() => import('./pages/ConstructionReports').then(m => ({ default: m.ConstructionReports })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const HistoryDetails = lazy(() => import('./pages/HistoryDetails').then(m => ({ default: m.HistoryDetails })));
const Examiners = lazy(() => import('./pages/Examiners').then(m => ({ default: m.Examiners })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
            <ToastProvider>
              <Router>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ErrorBoundary>
                          <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/history/:id" element={<HistoryDetails />} />
                            <Route path="/examiners" element={<Examiners />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/help" element={<Help />} />

                            <Route path="/reports" element={<Reports />} />
                            <Route path="/reports/new" element={<WaterMethodForm />} />
                            <Route path="/reports/new/air" element={<AirMethodForm />} />
                            <Route path="/reports/:id" element={<WaterMethodForm />} />
                            <Route path="/reports/air/:id" element={<AirMethodForm />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/customers/new" element={<CustomerForm />} />
                            <Route path="/customers/:id" element={<CustomerForm />} />
                            <Route path="/customers/:customerId/constructions" element={<Constructions />} />
                            <Route path="/customers/:customerId/constructions/new" element={<ConstructionForm />} />
                            <Route path="/customers/:customerId/constructions/:id" element={<ConstructionForm />} />

                            {/* Construction Reports Routes */}
                            <Route path="/customers/:customerId/constructions/:constructionId/reports" element={<ConstructionReports />} />
                            <Route path="/customers/:customerId/constructions/:constructionId/reports/new/water" element={<WaterMethodForm />} />
                            <Route path="/customers/:customerId/constructions/:constructionId/reports/new/air" element={<AirMethodForm />} />
                            <Route path="/customers/:customerId/constructions/:constructionId/reports/:id" element={<WaterMethodForm />} />
                            <Route path="/customers/:customerId/constructions/:constructionId/reports/air/:id" element={<AirMethodForm />} />
                            {/* Add other routes here */}
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </Layout>
                    </ProtectedRoute>
                  }
                  />
                  </Routes>
                </Suspense>
              </Router>
            </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
