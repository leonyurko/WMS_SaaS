import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Suppliers from './pages/Suppliers';
import EmailFormats from './pages/EmailFormats';
import WarehouseLayout from './pages/WarehouseLayout';
import DeliveryNotes from './pages/DeliveryNotes';
import EquipmentBorrowing from './pages/SigningForms';
import PublicBorrowing from './pages/PublicSign';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './stores/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="inventory-history" element={<Transactions />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="email-formats" element={<EmailFormats />} />
          <Route path="users" element={<Users />} />
          <Route path="settings/layout" element={<WarehouseLayout />} />
          <Route path="delivery-notes" element={<DeliveryNotes />} />
          <Route path="equipment-borrowing" element={<EquipmentBorrowing />} />
        </Route>

        {/* Public route for equipment borrowing (no auth required) */}
        <Route path="/borrow/:regulationId" element={<PublicBorrowing />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
