import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Header = ({ pageTitle, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <button className="p-2 rounded-full hover:bg-gray-100 hidden md:block">
            <i className="fas fa-bell text-gray-600"></i>
          </button>
          
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
