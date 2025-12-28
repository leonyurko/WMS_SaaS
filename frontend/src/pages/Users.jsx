import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

// All available pages for permission management
const ALL_PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'inventory-history', label: 'Inventory History' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'delivery-notes', label: 'Delivery Notes' },
  { key: 'equipment-borrowing', label: 'Equipment Borrowing' },
  { key: 'wear-equipment', label: 'Wear Equipment' },
  { key: 'email-formats', label: 'Email Formats' },
  { key: 'users', label: 'Users' }
];

const Users = () => {
  const { setPageTitle } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Staff'
  });

  // Permissions modal state
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    setPageTitle('User Management');
    loadUsers();
  }, [setPageTitle]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'Staff' });
    setEditingUser(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${editingUser.id}`, updateData);
        alert('User updated successfully');
      } else {
        await api.post('/users', formData);
        alert('User created successfully');
      }
      resetForm();
      loadUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  // Permissions handlers
  const handleOpenPermissions = async (user) => {
    if (user.role === 'Admin') {
      alert('Admin users have full access by default');
      return;
    }
    setPermissionsUser(user);
    setPermissionsLoading(true);
    setShowPermissionsModal(true);

    try {
      const response = await api.get(`/permissions/${user.id}`);
      if (response.data.status === 'success') {
        const accessiblePages = response.data.data.accessiblePages || [];
        const perms = {};
        ALL_PAGES.forEach(page => {
          perms[page.key] = accessiblePages.includes(page.key);
        });
        setUserPermissions(perms);
      }
    } catch (err) {
      console.error('Failed to load permissions', err);
      alert('Failed to load user permissions');
      setShowPermissionsModal(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handlePermissionChange = (pageKey) => {
    // Dashboard is always required
    if (pageKey === 'dashboard') return;
    setUserPermissions(prev => ({
      ...prev,
      [pageKey]: !prev[pageKey]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      const permissions = Object.entries(userPermissions).map(([pageKey, hasAccess]) => ({
        pageKey,
        hasAccess
      }));

      await api.put(`/permissions/${permissionsUser.id}`, { permissions });
      alert('Permissions saved successfully');
      setShowPermissionsModal(false);
      setPermissionsUser(null);
    } catch (err) {
      console.error('Failed to save permissions', err);
      alert('Failed to save permissions');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">System Users</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <i className="fas fa-user-plus mr-2"></i> Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPermissions(user)}
                        className={`${user.role === 'Admin' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`}
                        title={user.role === 'Admin' ? 'Admin has full access' : 'Manage Permissions'}
                      >
                        <i className="fas fa-key"></i>
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required={!editingUser}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "Leave blank to keep current password" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Page Permissions - {permissionsUser?.username}
              </h3>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setPermissionsUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {permissionsLoading ? (
              <div className="text-center py-6">Loading permissions...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ALL_PAGES.map((page) => (
                  <label
                    key={page.key}
                    className={`flex items-center p-3 rounded-lg border ${page.key === 'dashboard' ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                      } ${userPermissions[page.key] ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <input
                      type="checkbox"
                      checked={userPermissions[page.key] || false}
                      onChange={() => handlePermissionChange(page.key)}
                      disabled={page.key === 'dashboard'}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{page.label}</span>
                    {page.key === 'dashboard' && (
                      <span className="ml-auto text-xs text-gray-500">(Always On)</span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionsModal(false);
                  setPermissionsUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserCard = ({ user, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-900">{user.username}</span>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
            user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
            {user.role}
          </span>
        </div>
        <i className={`fas fa-chevron-down transform transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Email:</span>
            <span className="text-sm text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(user); }}
              className="text-blue-600 hover:text-blue-900 flex items-center"
            >
              <i className="fas fa-edit mr-1"></i> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
              className="text-red-600 hover:text-red-900 flex items-center"
            >
              <i className="fas fa-trash mr-1"></i> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
