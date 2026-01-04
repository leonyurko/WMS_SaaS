import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

const Transactions = () => {
  const { setPageTitle } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    productId: '',
    userId: '',
    search: ''
  });

  useEffect(() => {
    setPageTitle('Inventory History');
    loadTransactions();
    loadFiltersData();
  }, [setPageTitle, filters]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadFiltersData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/users')
      ]);
      if (productsRes.data.status === 'success') {
        setProducts(productsRes.data.data.items);
      }
      if (usersRes.data.status === 'success') {
        setUsers(usersRes.data.data.users);
      }
    } catch (err) {
      console.error('Failed to load filter data', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.productId) params.productId = filters.productId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/transactions', { params });
      if (response.data.status === 'success') {
        setTransactions(response.data.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getTypeColor = (type) => {
    return type === 'addition' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getTypeLabel = (type) => {
    return type === 'addition' ? 'Addition' : 'Deduction';
  };

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product, user, or type..."
            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="dateTo"
              className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              name="productId"
              className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.productId}
              onChange={handleFilterChange}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              name="userId"
              className="border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.userId}
              onChange={handleFilterChange}
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 text-right">
            <button
              onClick={() => setFilters({ dateFrom: '', dateTo: '', type: '', productId: '', userId: '' })}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(tx.transaction_type)}`}>
                        {getTypeLabel(tx.transaction_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tx.product_name}
                      <div className="text-xs text-gray-500">{tx.product_barcode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.warehouse_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {tx.transaction_type === 'addition' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.user_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transactions;
