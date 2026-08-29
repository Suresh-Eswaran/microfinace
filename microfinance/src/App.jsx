import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Admin from './pages/Admin';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Collections from './pages/Collections';
import Compliance from './pages/Compliance';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import LoanApply from './pages/LoanApply';
import LoanDetail from './pages/LoanDetail';
import Loans from './pages/Loans';
import Login from './pages/Login';
import Portfolio from './pages/Portfolio';
import Register from './pages/Register';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes — all nested under Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="clients"         element={<Clients />} />
          <Route path="clients/:id"     element={<ClientDetail />} />
          <Route path="loans"           element={<Loans />} />
          <Route path="loans/apply"     element={<LoanApply />} />
          <Route path="loans/:id"       element={<LoanDetail />} />
          <Route path="collections"     element={<Collections />} />
          <Route path="groups"          element={<Groups />} />
          <Route path="portfolio"       element={<Portfolio />} />
          <Route path="compliance"      element={<Compliance />} />
          <Route path="reports"         element={<Reports />} />
          <Route path="admin"           element={<Admin />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
