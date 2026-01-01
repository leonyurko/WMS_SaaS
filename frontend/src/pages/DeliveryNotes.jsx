import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

const DeliveryNotes = () => {
    const { setPageTitle } = useOutletContext();
    const { user } = useAuthStore();
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentNote, setCurrentNote] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        supplierId: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
        mediaUrls: []
    });

    useEffect(() => {
        setPageTitle('Delivery Notes');
        loadDeliveryNotes();
        loadSuppliers();
    }, [setPageTitle]);

    const loadDeliveryNotes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/delivery-notes', { params: { search } });
            setDeliveryNotes(response.data.deliveryNotes || []);
        } catch (err) {
            console.error('Failed to load delivery notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            if (response.data.status === 'success') {
                setSuppliers(response.data.data.suppliers || []);
            }
        } catch (err) {
            console.error('Failed to load suppliers:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            supplierId: '',
            deliveryDate: new Date().toISOString().split('T')[0],
            notes: '',
            mediaUrls: []
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleEdit = (note) => {
        setFormData({
            supplierId: note.supplier_id || '',
            deliveryDate: note.delivery_date ? note.delivery_date.split('T')[0] : '',
            notes: note.notes || '',
            mediaUrls: note.media_urls || []
        });
        setCurrentId(note.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleView = (note) => {
        setCurrentNote(note);
        setShowViewModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this delivery note?')) return;
        try {
            await api.delete(`/delivery-notes/${id}`);
            loadDeliveryNotes();
        } catch (err) {
            alert('Failed to delete delivery note');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                supplierId: formData.supplierId || null
            };

            if (isEditing) {
                await api.put(`/delivery-notes/${currentId}`, payload);
                alert('Delivery note updated successfully');
            } else {
                await api.post('/delivery-notes', payload);
                alert('Delivery note created successfully');
            }
            setShowModal(false);
            resetForm();
            loadDeliveryNotes();
        } catch (err) {
            console.error(err);
            alert('Failed to save delivery note');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!currentId) {
            alert('Please save the delivery note first before uploading files');
            return;
        }

        const formDataFile = new FormData();
        formDataFile.append('file', file);

        try {
            setUploading(true);
            const response = await api.post(`/delivery-notes/${currentId}/media`, formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFormData(prev => ({
                ...prev,
                mediaUrls: response.data.note.media_urls || []
            }));

            loadDeliveryNotes();
            alert('File uploaded successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveMedia = async (mediaUrl) => {
        if (!currentId) return;
        if (!window.confirm('Remove this file?')) return;

        try {
            const response = await api.delete(`/delivery-notes/${currentId}/media`, {
                data: { mediaUrl }
            });
            setFormData(prev => ({
                ...prev,
                mediaUrls: response.data.media_urls || []
            }));
            loadDeliveryNotes();
        } catch (err) {
            console.error(err);
            alert('Failed to remove file');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('he-IL');
    };

    const getMediaType = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        return 'other';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search delivery notes..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && loadDeliveryNotes()}
                    />
                </div>
                <div className="ml-4">
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i> Add Delivery Note
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {deliveryNotes.map((note) => (
                                    <tr key={note.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(note.delivery_date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{note.supplier_name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{note.received_by_username}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{note.notes || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {(note.media_urls?.length || 0) > 0 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <i className="fas fa-paperclip mr-1"></i> {note.media_urls.length}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleView(note)}
                                                className="text-green-600 hover:text-green-900"
                                                title="View"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(note)}
                                                className="text-brand-red hover:text-red-900"
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
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
                        {deliveryNotes.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No delivery notes found</div>
                        )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {deliveryNotes.map((note) => (
                            <div key={note.id} className="border-b border-gray-200 last:border-0 p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-semibold text-gray-900">{formatDate(note.delivery_date)}</div>
                                        <div className="text-sm text-gray-500">{note.supplier_name || 'No Supplier'}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleView(note)} className="text-green-600"><i className="fas fa-eye"></i></button>
                                        <button onClick={() => handleEdit(note)} className="text-brand-red"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDelete(note.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Received by:</span> {note.received_by_username}
                                </div>
                                {note.notes && (
                                    <div className="text-sm text-gray-600 mt-1 truncate">
                                        <span className="font-medium">Notes:</span> {note.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                        {deliveryNotes.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No delivery notes found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Edit Delivery Note' : 'Add New Delivery Note'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Supplier (Optional)</label>
                                <select
                                    name="supplierId"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.supplierId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">-- No Supplier (One-time delivery) --</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Delivery Date *</label>
                                <input
                                    type="date"
                                    name="deliveryDate"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.deliveryDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Enter any notes about this delivery..."
                                ></textarea>
                            </div>

                            {/* File Upload Section - Only shown when editing */}
                            {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Media Files (Images/PDFs)
                                    </label>

                                    {/* Current Media */}
                                    {formData.mediaUrls.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {formData.mediaUrls.map((url, idx) => (
                                                <div key={idx} className="relative group">
                                                    {getMediaType(url) === 'image' ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`}
                                                            alt={`Media ${idx + 1}`}
                                                            className="w-full h-24 object-cover rounded border"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded border">
                                                            <i className="fas fa-file-pdf text-3xl text-red-500"></i>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMedia(url)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <i className="fas fa-times text-xs"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                                        >
                                            {uploading ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i> Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-upload mr-2"></i> Upload File
                                                </>
                                            )}
                                        </button>
                                        <span className="text-xs text-gray-500">Images and PDFs up to 10MB</span>
                                    </div>
                                </div>
                            )}

                            {!isEditing && (
                                <p className="text-sm text-gray-500 italic">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Save the delivery note first, then you can add media files.
                                </p>
                            )}

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
                                    className="px-4 py-2 bg-brand-red text-white rounded-md hover:bg-red-700"
                                >
                                    {isEditing ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && currentNote && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Delivery Note Details</h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Delivery Date</label>
                                    <p className="mt-1 text-gray-900">{formatDate(currentNote.delivery_date)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Received By</label>
                                    <p className="mt-1 text-gray-900">{currentNote.received_by_username}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500">Supplier</label>
                                <p className="mt-1 text-gray-900">{currentNote.supplier_name || 'N/A (One-time delivery)'}</p>
                            </div>

                            {currentNote.notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{currentNote.notes}</p>
                                </div>
                            )}

                            {/* Media Gallery */}
                            {currentNote.media_urls?.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Attached Media</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {currentNote.media_urls.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                {getMediaType(url) === 'image' ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`}
                                                        alt={`Media ${idx + 1}`}
                                                        className="w-full h-32 object-cover rounded border hover:opacity-75 transition-opacity"
                                                    />
                                                ) : (
                                                    <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 rounded border hover:bg-gray-200 transition-colors">
                                                        <i className="fas fa-file-pdf text-4xl text-red-500 mb-2"></i>
                                                        <span className="text-xs text-gray-500">View PDF</span>
                                                    </div>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowViewModal(false)}
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

export default DeliveryNotes;
