import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './stores/authStore';

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
import WearEquipment from './pages/WearEquipment';
import Categories from './pages/Categories';
import PublicBorrowing from './pages/PublicSign';
import Settings from './pages/Settings';

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
          <Route path="categories" element={<Categories />} />
          <Route path="email-formats" element={<EmailFormats />} />
          <Route path="users" element={<Users />} />
          <Route path="settings/layout" element={<WarehouseLayout />} />
          <Route path="delivery-notes" element={<DeliveryNotes />} />
          <Route path="equipment-borrowing" element={<EquipmentBorrowing />} />
          <Route path="wear-equipment" element={<WearEquipment />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/borrow/:regulationId" element={<PublicBorrowing />} />
        <Route path="/borrow/t/:token" element={<PublicBorrowing />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
