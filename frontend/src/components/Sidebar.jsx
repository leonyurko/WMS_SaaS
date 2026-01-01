import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard', key: 'dashboard' },
    { path: '/inventory', icon: 'fa-boxes', label: 'Inventory', key: 'inventory' },
    { path: '/scanner', icon: 'fa-qrcode', label: 'Scanner', key: 'scanner' },
    { path: '/inventory-history', icon: 'fa-exchange-alt', label: 'Inventory History', key: 'inventory-history' },
    { path: '/suppliers', icon: 'fa-truck', label: 'Suppliers', key: 'suppliers' },
    { path: '/delivery-notes', icon: 'fa-file-alt', label: 'Delivery Notes', key: 'delivery-notes' },
    { path: '/equipment-borrowing', icon: 'fa-handshake', label: 'Equipment Borrowing', key: 'equipment-borrowing' },
    { path: '/wear-equipment', icon: 'fa-tools', label: 'Wear Equipment', key: 'wear-equipment' },
    { path: '/email-formats', icon: 'fa-envelope', label: 'Email Formats', key: 'email-formats' },
    { path: '/users', icon: 'fa-users', label: 'Users', key: 'users' },
  ];

  // Use accessiblePages from user object if available, otherwise use role-based defaults
  const accessiblePages = user?.accessiblePages || [];
  const filteredNavItems = navItems.filter(item => accessiblePages.includes(item.key));

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
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-black text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex justify-between items-center border-b border-gray-800 h-20">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                </path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wide leading-none text-white">SERVERFARM</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">Management</span>
            </div>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path)
                ? 'bg-brand-red text-white shadow-lg shadow-red-900/20 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
