import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

const Header = ({ pageTitle, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
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
      const notifs = [];

      // Fetch low stock items
      const inventoryRes = await api.get('/inventory', { params: { status: 'Low Stock' } });
      const lowStockItems = inventoryRes.data?.data?.items || [];
      lowStockItems.forEach(item => {
        notifs.push({
          id: `lowstock-${item.id}`,
          type: 'low_stock',
          title: 'Low Stock',
          message: `${item.name} is running low (${item.current_stock} left)`,
          link: '/inventory?status=Low%20Stock',
          severity: 'warning',
          icon: 'fa-exclamation-triangle'
        });
      });

      // Fetch out of stock items
      const outOfStockRes = await api.get('/inventory', { params: { status: 'Out of Stock' } });
      const outOfStockItems = outOfStockRes.data?.data?.items || [];
      outOfStockItems.forEach(item => {
        notifs.push({
          id: `outofstock-${item.id}`,
          type: 'out_of_stock',
          title: 'Out of Stock',
          message: `${item.name} is out of stock!`,
          link: '/inventory?status=Out%20of%20Stock',
          severity: 'critical',
          icon: 'fa-times-circle'
        });
      });

      // Fetch critical/high wear reports
      try {
        const wearRes = await api.get('/wear-equipment/stats');
        const wearStats = wearRes.data?.stats;
        if (wearStats) {
          const criticalCount = parseInt(wearStats.critical_count) || 0;
          const highCount = parseInt(wearStats.high_count) || 0;
          if (criticalCount > 0) {
            notifs.push({
              id: 'wear-critical',
              type: 'wear_critical',
              title: 'Critical Wear Reports',
              message: `${criticalCount} critical wear report(s) need attention`,
              link: '/wear-equipment',
              severity: 'critical',
              icon: 'fa-tools'
            });
          }
          if (highCount > 0) {
            notifs.push({
              id: 'wear-high',
              type: 'wear_high',
              title: 'High Priority Wear',
              message: `${highCount} high priority wear report(s)`,
              link: '/wear-equipment',
              severity: 'warning',
              icon: 'fa-tools'
            });
          }
        }
      } catch (err) {
        // Wear equipment API might not exist yet, ignore
      }

      setNotifications(notifs);
      setNotificationCount(notifs.length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

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
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <p className="text-sm text-gray-500">{notificationCount} items need attention</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <i className="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                      <p>All caught up!</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <Link
                        key={notif.id}
                        to={notif.link}
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-start px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${getSeverityColor(notif.severity)}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${notif.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                          }`}>
                          <i className={`fas ${notif.icon} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-gray-600 truncate">{notif.message}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <Link
                      to="/inventory?status=Low%20Stock"
                      onClick={() => setShowDropdown(false)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all inventory alerts →
                    </Link>
                  </div>
                )}
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
