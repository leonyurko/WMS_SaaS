import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get the current page key from the path
  const pageKey = location.pathname.replace('/', '') || 'dashboard';

  // Check if user has access to this page
  const accessiblePages = user?.accessiblePages || [];

  // Dashboard is always accessible as a fallback
  if (pageKey !== 'dashboard' && !accessiblePages.includes(pageKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
