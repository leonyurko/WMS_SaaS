import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

const Suppliers = () => {
  const { setPageTitle } = useOutletContext();
  const { user } = useAuthStore();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [emailFormats, setEmailFormats] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    location: '',
    notes: ''
  });

  const [orderData, setOrderData] = useState({
    itemId: '',
    quantity: '',
    notes: '',
    formatId: ''
  });

  const [emailPreview, setEmailPreview] = useState(null);

  useEffect(() => {
    setPageTitle('Supplier Details');
    loadSuppliers();
    loadInventory();
    loadEmailFormats();
  }, [setPageTitle]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers', { params: { search } });
      if (response.data.status === 'success') {
        setSuppliers(response.data.data.suppliers);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await api.get('/inventory');
      if (response.data.status === 'success') {
        setInventory(response.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const loadEmailFormats = async () => {
    try {
      const response = await api.get('/email-formats');
      if (response.data.status === 'success') {
        setEmailFormats(response.data.data.formats);
      }
    } catch (err) {
      console.error('Failed to load email formats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', contactPerson: '', phone: '', email: '', location: '', notes: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email,
      location: supplier.location || '',
      notes: supplier.notes || ''
    });
    setCurrentId(supplier.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      loadSuppliers();
    } catch (err) {
      alert('Failed to delete supplier');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/suppliers/${currentId}`, formData);
        alert('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        alert('Supplier added successfully');
      }
      setShowModal(false);
      resetForm();
      loadSuppliers();
    } catch (err) {
      console.error(err);
      alert('Failed to save supplier');
    }
  };

  const openOrderModal = (supplier) => {
    setCurrentSupplier(supplier);
    setOrderData({ itemId: '', quantity: '', notes: '', formatId: '' });
    setEmailPreview(null);
    setShowOrderModal(true);
  };

  const handlePreviewOrder = () => {
    if (!orderData.formatId) {
      alert('Please select an email format');
      return;
    }

    const format = emailFormats.find(f => f.id === orderData.formatId);
    const item = inventory.find(i => i.id === orderData.itemId);

    if (!format) return;

    // Simple preview - replace variables
    let subject = format.subject;
    let body = format.body;

    const replacements = {
      '{userName}': user?.username || 'Current User',
      '{companyName}': 'Your Company',
      '{supplierName}': currentSupplier.name,
      '{itemName}': item ? item.name : 'Various Items',
      '{quantity}': orderData.quantity || 'N/A',
      '{notes}': orderData.notes || '',
      '{contactPerson}': currentSupplier.contact_person || ''
    };

    // Use split-join to avoid regex issues with special characters
    Object.keys(replacements).forEach(key => {
      subject = subject.split(key).join(replacements[key]);
      body = body.split(key).join(replacements[key]);
    });

    setEmailPreview({ subject, body });
  };

  const handleConfirmOrder = async () => {
    try {
      await api.post(`/suppliers/${currentSupplier.id}/order`, orderData);
      alert('Order email sent successfully!');
      setShowOrderModal(false);
      setEmailPreview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to send order email');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadSuppliers()}
          />
        </div>
        <div className="ml-4">
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> Add Supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Send Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.contact_person || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.location || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openOrderModal(supplier)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Place an Order
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isEditing ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && currentSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Place Order - {currentSupplier.name}
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {!emailPreview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Item</label>
                  <select
                    name="itemId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={orderData.itemId}
                    onChange={handleOrderChange}
                  >
                    <option value="">-- Select Item --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={orderData.quantity}
                    onChange={handleOrderChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Format *</label>
                  <select
                    name="formatId"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={orderData.formatId}
                    onChange={handleOrderChange}
                  >
                    <option value="">-- Select Format --</option>
                    {emailFormats.map(format => (
                      <option key={format.id} value={format.id}>{format.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={orderData.notes}
                    onChange={handleOrderChange}
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePreviewOrder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Preview Email
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Email Preview</h4>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase">To:</label>
                    <p className="text-sm">{currentSupplier.email}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase">Subject:</label>
                    <p className="text-sm font-medium" dir="rtl" style={{textAlign: 'right'}}>{emailPreview.subject}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Body:</label>
                    <div className="bg-white p-4 rounded border text-sm whitespace-pre-wrap" dir="rtl" style={{textAlign: 'right'}}>
                      {emailPreview.body}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEmailPreview(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirm & Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
