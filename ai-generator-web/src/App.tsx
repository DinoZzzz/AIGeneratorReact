import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Reports } from './pages/Reports';
import { WaterMethodForm } from './pages/WaterMethodForm';
import { AirMethodForm } from './pages/AirMethodForm';
import { Customers } from './pages/Customers';
import { CustomerForm } from './pages/CustomerForm';
import { Constructions } from './pages/Constructions';
import { ConstructionForm } from './pages/ConstructionForm';
import { ConstructionReports } from './pages/ConstructionReports';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { HistoryDetails } from './pages/HistoryDetails';
import { Examiners } from './pages/Examiners';
import { Help } from './pages/Help';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/examiners" element={<Examiners />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/help" element={<Help />} />
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/history/:id" element={<HistoryDetails />} />
                      <Route path="/examiners" element={<Examiners />} />
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
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
