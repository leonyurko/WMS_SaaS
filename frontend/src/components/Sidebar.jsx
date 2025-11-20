import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard', roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/inventory', icon: 'fa-boxes', label: 'Inventory', roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/scanner', icon: 'fa-qrcode', label: 'Scanner', roles: ['Admin', 'Manager', 'Staff'] },
    { path: '/inventory-history', icon: 'fa-exchange-alt', label: 'Inventory History', roles: ['Admin', 'Manager'] },
    { path: '/suppliers', icon: 'fa-truck', label: 'Suppliers', roles: ['Admin', 'Manager'] },
    { path: '/email-formats', icon: 'fa-envelope', label: 'Email Formats', roles: ['Admin'] },
    { path: '/users', icon: 'fa-users', label: 'Users', roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold flex items-center space-x-2">
            <i className="fas fa-warehouse"></i>
            <span>WMS</span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <nav className="mt-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`block py-2.5 px-6 rounded-r-lg transition duration-200 ${
                isActive(item.path)
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-700'
              }`}
            >
              <i className={`fas ${item.icon} w-6 mr-3`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
