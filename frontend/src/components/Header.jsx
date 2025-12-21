import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

const Header = ({ pageTitle, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    outOfStock: [],
    lowStock: [],
    wearCritical: [],
    wearHigh: []
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const notifs = {
        outOfStock: [],
        lowStock: [],
        wearCritical: [],
        wearHigh: []
      };
      let count = 0;

      // Fetch low stock items
      try {
        const lowStockRes = await api.get('/inventory', { params: { status: 'Low Stock' } });
        const lowStockItems = lowStockRes.data?.data?.items || [];
        notifs.lowStock = lowStockItems.slice(0, 5).map(item => ({
          id: item.id,
          name: item.name,
          stock: item.current_stock,
          location: item.location
        }));
        count += lowStockItems.length;
      } catch (e) { console.error('Low stock fetch failed:', e); }

      // Fetch out of stock items
      try {
        const outRes = await api.get('/inventory', { params: { status: 'Out of Stock' } });
        const outItems = outRes.data?.data?.items || [];
        notifs.outOfStock = outItems.slice(0, 5).map(item => ({
          id: item.id,
          name: item.name,
          location: item.location
        }));
        count += outItems.length;
      } catch (e) { console.error('Out of stock fetch failed:', e); }

      // Fetch wear equipment stats
      try {
        const wearRes = await api.get('/wear-equipment/stats');
        const stats = wearRes.data?.stats;
        if (stats) {
          const criticalCount = parseInt(stats.critical_count) || 0;
          const highCount = parseInt(stats.high_count) || 0;
          if (criticalCount > 0) {
            notifs.wearCritical = [{ count: criticalCount }];
            count += 1;
          }
          if (highCount > 0) {
            notifs.wearHigh = [{ count: highCount }];
            count += 1;
          }
        }
      } catch (e) { /* Wear API might not exist */ }

      setNotifications(notifs);
      setNotificationCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasNotifications = notificationCount > 0;
  const { outOfStock, lowStock, wearCritical, wearHigh } = notifications;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-4 py-4 md:px-6">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 text-gray-600 hover:text-gray-900 md:hidden focus:outline-none"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <i className="fas fa-bell text-gray-600"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {!hasNotifications ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                      <p>All caught up! No alerts.</p>
                    </div>
                  ) : (
                    <>
                      {/* Out of Stock Section */}
                      {outOfStock.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center">
                            <i className="fas fa-times-circle text-red-600 mr-2"></i>
                            <span className="font-semibold text-red-800 text-sm">Out of Stock ({outOfStock.length})</span>
                          </div>
                          {outOfStock.map(item => (
                            <Link
                              key={item.id}
                              to={`/inventory?status=Out%20of%20Stock`}
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center px-4 py-2 hover:bg-red-50 border-b border-gray-100 text-sm"
                            >
                              <span className="flex-1 truncate font-medium text-gray-700">{item.name}</span>
                              <span className="text-red-600 text-xs ml-2">0 left</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Low Stock Section */}
                      {lowStock.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center">
                            <i className="fas fa-exclamation-triangle text-amber-600 mr-2"></i>
                            <span className="font-semibold text-amber-800 text-sm">Low Stock ({lowStock.length})</span>
                          </div>
                          {lowStock.map(item => (
                            <Link
                              key={item.id}
                              to={`/inventory?status=Low%20Stock`}
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center px-4 py-2 hover:bg-amber-50 border-b border-gray-100 text-sm"
                            >
                              <span className="flex-1 truncate font-medium text-gray-700">{item.name}</span>
                              <span className="text-amber-600 text-xs ml-2">{item.stock} left</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Wear Equipment - Critical */}
                      {wearCritical.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center">
                            <i className="fas fa-tools text-red-600 mr-2"></i>
                            <span className="font-semibold text-red-800 text-sm">Critical Wear Reports</span>
                          </div>
                          <Link
                            to="/wear-equipment"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center px-4 py-2 hover:bg-red-50 border-b border-gray-100 text-sm"
                          >
                            <span className="flex-1 text-gray-700">{wearCritical[0].count} critical report(s) need immediate attention</span>
                            <i className="fas fa-arrow-right text-red-400 ml-2"></i>
                          </Link>
                        </div>
                      )}

                      {/* Wear Equipment - High */}
                      {wearHigh.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center">
                            <i className="fas fa-tools text-orange-600 mr-2"></i>
                            <span className="font-semibold text-orange-800 text-sm">High Priority Wear</span>
                          </div>
                          <Link
                            to="/wear-equipment"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center px-4 py-2 hover:bg-orange-50 border-b border-gray-100 text-sm"
                          >
                            <span className="flex-1 text-gray-700">{wearHigh[0].count} high priority report(s)</span>
                            <i className="fas fa-arrow-right text-orange-400 ml-2"></i>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-gray-700 font-medium text-sm">{user?.username}</span>
              <span className="text-gray-500 text-xs">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 text-gray-600 hover:text-gray-800"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
