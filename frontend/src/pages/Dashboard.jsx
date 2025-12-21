import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import KPICard from '../components/KPICard';
import PostFeed from '../components/dashboard/PostFeed';
import { fetchDashboardMetrics } from '../services/dashboardService';

const Dashboard = () => {
  const { setPageTitle } = useOutletContext();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get user from local storage (or context if available globally, but local storage is simplest for now)
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setPageTitle('Dashboard');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    loadMetrics();
  }, [setPageTitle]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/inventory">
          <KPICard
            title="Total Products"
            value={metrics?.totalProducts || 0}
            icon="fa-box"
            iconColor="text-blue-500"
            bgColor="bg-blue-100"
          />
        </Link>
        <Link to="/inventory?status=low">
          <KPICard
            title="Low Stock Items"
            value={metrics?.lowStockCount || 0}
            icon="fa-exclamation-triangle"
            iconColor="text-red-500"
            bgColor="bg-red-100"
          />
        </Link>
        <Link to="/inventory?status=out">
          <KPICard
            title="Out of Stock"
            value={metrics?.outOfStockCount || 0}
            icon="fa-times-circle"
            iconColor="text-orange-500"
            bgColor="bg-orange-100"
          />
        </Link>
        <Link to="/inventory-history">
          <KPICard
            title="Recent Transactions"
            value={metrics?.recentTransactions || 0}
            icon="fa-exchange-alt"
            iconColor="text-green-500"
            bgColor="bg-green-100"
          />
        </Link>
        <Link to="/scanner">
          <KPICard
            title="Quick Scan"
            value="Scan"
            icon="fa-qrcode"
            iconColor="text-purple-500"
            bgColor="bg-purple-100"
          />
        </Link>
        <Link to="/inventory?warehouse=Small">
          <KPICard
            title="Small Warehouse"
            value="View"
            icon="fa-warehouse"
            iconColor="text-indigo-500"
            bgColor="bg-indigo-100"
          />
        </Link>
        <Link to="/inventory?warehouse=Large">
          <KPICard
            title="Large Warehouse"
            value="View"
            icon="fa-industry"
            iconColor="text-teal-500"
            bgColor="bg-teal-100"
          />
        </Link>
        <Link to="/wear-equipment">
          <KPICard
            title="Wear Equipment"
            value="View"
            icon="fa-tools"
            iconColor="text-amber-500"
            bgColor="bg-amber-100"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-[600px]">
        {/* Admin Updates Feed */}
        <PostFeed
          type="admin"
          title="Admin Updates"
          currentUser={currentUser}
        />

        {/* Staff Updates Feed */}
        <PostFeed
          type="staff"
          title="Staff Updates"
          currentUser={currentUser}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Welcome to WMS</h2>
        <p className="text-gray-600">
          Use the navigation menu to manage your warehouse inventory, scan barcodes, view transactions, and more.
        </p>
      </div>
    </div>
  );
};


export default Dashboard;
