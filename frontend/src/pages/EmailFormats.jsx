import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

const EmailFormats = () => {
  const { setPageTitle } = useOutletContext();
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    formatType: 'order'
  });

  useEffect(() => {
    setPageTitle('Email Format Structure');
    loadFormats();
  }, [setPageTitle]);

  const loadFormats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-formats');
      if (response.data.status === 'success') {
        setFormats(response.data.data.formats);
      }
    } catch (err) {
      console.error('Failed to load formats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', subject: '', body: '', formatType: 'order'
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (format) => {
    setFormData({
      name: format.name,
      subject: format.subject,
      body: format.body,
      formatType: format.format_type
    });
    setCurrentId(format.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this format?')) return;
    try {
      await api.delete(`/email-formats/${id}`);
      loadFormats();
    } catch (err) {
      alert('Failed to delete format');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/email-formats/${currentId}`, formData);
        alert('Format updated successfully');
      } else {
        await api.post('/email-formats', formData);
        alert('Format created successfully');
      }
      setShowModal(false);
      resetForm();
      loadFormats();
    } catch (err) {
      console.error(err);
      alert('Failed to save format');
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('textarea[name="body"]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData(prev => ({ ...prev, body: newText }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  const variables = [
    { name: 'User Name', value: '{userName}' },
    { name: 'Company Name', value: '{companyName}' },
    { name: 'Supplier Name', value: '{supplierName}' },
    { name: 'Contact Person', value: '{contactPerson}' },
    { name: 'Item Name', value: '{itemName}' },
    { name: 'Quantity', value: '{quantity}' },
    { name: 'Notes', value: '{notes}' }
  ];

  return (
    <div>
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-500"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Available Variables</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Use these variables in your email templates. They will be replaced with actual values when sending:</p>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                {variables.map(v => (
                  <code key={v.value} className="bg-blue-100 px-2 py-1 rounded text-xs">{v.value}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Email Templates</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i> Add Format
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {formats.map((format) => (
            <div key={format.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{format.name}</h3>
                  <span className="text-xs text-gray-500">Created by {format.created_by_user || 'Unknown'}</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(format)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(format.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Subject:</label>
                  <p className="text-sm font-medium text-gray-700" dir="rtl" style={{textAlign: 'right'}}>{format.subject}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Body Preview:</label>
                  <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap border" dir="rtl" style={{textAlign: 'right'}}>
                    {format.body.substring(0, 200)}{format.body.length > 200 ? '...' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {formats.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <i className="fas fa-envelope text-gray-300 text-5xl mb-4"></i>
              <p className="text-gray-500">No email formats created yet. Click "Add Format" to create one.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Format Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Email Format' : 'Create Email Format'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Format Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Standard Order Request"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Subject *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  dir="rtl"
                  placeholder="בקשת הזמנה מ-{companyName}"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-right"
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Email Body *</label>
                  <div className="text-xs text-gray-500">Insert variables:</div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {variables.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => insertVariable(v.value)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded border"
                      title={`Insert ${v.name}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
                <textarea
                  name="body"
                  required
                  rows="12"
                  dir="rtl"
                  placeholder={`שלום,\n\nאני {userName} מ-{companyName}. ברצוננו להזמין {quantity} יחידות של {itemName}.\n\n{notes}\n\nבברכה`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm text-right"
                  value={formData.body}
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
                  {isEditing ? 'Update Format' : 'Create Format'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailFormats;
