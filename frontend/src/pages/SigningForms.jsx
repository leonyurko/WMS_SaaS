import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

const SigningForms = () => {
    const { setPageTitle } = useOutletContext();
    const { user } = useAuthStore();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSignaturesModal, setShowSignaturesModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentForm, setCurrentForm] = useState(null);
    const [signatures, setSignatures] = useState([]);
    const [loadingSignatures, setLoadingSignatures] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        regulationText: '',
        isActive: true
    });

    useEffect(() => {
        setPageTitle('Equipment Signing Forms');
        loadForms();
    }, [setPageTitle]);

    const loadForms = async () => {
        try {
            setLoading(true);
            const response = await api.get('/signatures/forms');
            setForms(response.data || []);
        } catch (err) {
            console.error('Failed to load forms:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({ name: '', regulationText: '', isActive: true });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleEdit = (form) => {
        setFormData({
            name: form.name,
            regulationText: form.regulation_text,
            isActive: form.is_active
        });
        setCurrentId(form.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this form? All associated signatures will also be deleted.')) return;
        try {
            await api.delete(`/signatures/forms/${id}`);
            loadForms();
        } catch (err) {
            alert('Failed to delete form');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/signatures/forms/${currentId}`, formData);
                alert('Form updated successfully');
            } else {
                await api.post('/signatures/forms', formData);
                alert('Form created successfully');
            }
            setShowModal(false);
            resetForm();
            loadForms();
        } catch (err) {
            console.error(err);
            alert('Failed to save form');
        }
    };

    const viewSignatures = async (form) => {
        setCurrentForm(form);
        setShowSignaturesModal(true);
        setLoadingSignatures(true);
        try {
            const response = await api.get(`/signatures/forms/${form.id}/signatures`);
            setSignatures(response.data.signatures || []);
        } catch (err) {
            console.error('Failed to load signatures:', err);
            setSignatures([]);
        } finally {
            setLoadingSignatures(false);
        }
    };

    const copyLink = (formId) => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/sign/${formId}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('he-IL');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-medium text-gray-700">Manage equipment regulation signing forms</h2>
                </div>
                <div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i> Create Form
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid gap-4">
                    {forms.map((form) => (
                        <div key={form.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {form.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Created by {form.created_by_username} • {formatDate(form.created_at)}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{form.regulation_text}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        <i className="fas fa-signature mr-1"></i> {form.signature_count || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyLink(form.id)}
                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                                    >
                                        <i className="fas fa-link mr-1"></i> Copy Link
                                    </button>
                                    <button
                                        onClick={() => viewSignatures(form)}
                                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
                                    >
                                        <i className="fas fa-list mr-1"></i> View Signatures
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(form)}
                                        className="p-2 text-blue-600 hover:text-blue-900 bg-white rounded border border-gray-300 shadow-sm"
                                        title="Edit"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    {user?.role === 'Admin' && (
                                        <button
                                            onClick={() => handleDelete(form.id)}
                                            className="p-2 text-red-600 hover:text-red-900 bg-white rounded border border-gray-300 shadow-sm"
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {forms.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <i className="fas fa-file-signature text-4xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500">No signing forms created yet</p>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Your First Form
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Edit Signing Form' : 'Create Signing Form'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Form Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="e.g., Equipment Usage Agreement"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Regulation Text *</label>
                                <textarea
                                    name="regulationText"
                                    required
                                    rows="10"
                                    placeholder="Enter the full regulation text that customers will read and sign..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.regulationText}
                                    onChange={handleInputChange}
                                ></textarea>
                                <p className="mt-1 text-xs text-gray-500">This text will be displayed to customers before they sign.</p>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    id="isActive"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                    Active (customers can access and sign)
                                </label>
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
                                    {isEditing ? 'Update Form' : 'Create Form'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Signatures Modal */}
            {showSignaturesModal && currentForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Signatures</h3>
                                <p className="text-sm text-gray-500">{currentForm.name}</p>
                            </div>
                            <button onClick={() => setShowSignaturesModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {loadingSignatures ? (
                            <div className="text-center py-8">Loading signatures...</div>
                        ) : signatures.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signed At</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signature</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {signatures.map((sig) => (
                                            <tr key={sig.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{sig.customer_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{sig.customer_email || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{sig.customer_phone || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sig.signed_at)}</td>
                                                <td className="px-4 py-3">
                                                    {sig.signature_data && (
                                                        <img
                                                            src={sig.signature_data}
                                                            alt="Signature"
                                                            className="h-10 max-w-[150px] object-contain border rounded bg-white"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <i className="fas fa-signature text-4xl text-gray-300 mb-4"></i>
                                <p className="text-gray-500">No signatures yet</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowSignaturesModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SigningForms;
