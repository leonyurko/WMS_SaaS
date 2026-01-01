import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

const EquipmentBorrowing = () => {
    const { setPageTitle } = useOutletContext();
    const { user } = useAuthStore();
    const [regulations, setRegulations] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('open'); // 'open', 'archived', 'regulations'
    const [showModal, setShowModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [currentTicket, setCurrentTicket] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        regulationText: '',
        isActive: true
    });

    useEffect(() => {
        setPageTitle('Equipment Borrowing');
        loadData();
    }, [setPageTitle, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'regulations') {
                await loadRegulations();
            } else {
                await loadTickets(activeTab);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadRegulations = async () => {
        try {
            const response = await api.get('/equipment-borrowing/regulations');
            setRegulations(response.data || []);
        } catch (err) {
            console.error('Failed to load regulations:', err);
        }
    };

    const loadTickets = async (status) => {
        try {
            const response = await api.get('/equipment-borrowing/tickets', { params: { status } });
            setTickets(response.data.tickets || []);
        } catch (err) {
            console.error('Failed to load tickets:', err);
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

    const handleEdit = (regulation) => {
        setFormData({
            name: regulation.name,
            regulationText: regulation.regulation_text,
            isActive: regulation.is_active
        });
        setCurrentId(regulation.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? All tickets will also be deleted.')) return;
        try {
            await api.delete(`/equipment-borrowing/regulations/${id}`);
            loadRegulations();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/equipment-borrowing/regulations/${currentId}`, formData);
            } else {
                await api.post('/equipment-borrowing/regulations', formData);
            }
            setShowModal(false);
            resetForm();
            loadRegulations();
        } catch (err) {
            alert('Failed to save');
        }
    };

    const viewTicket = (ticket) => {
        setCurrentTicket(ticket);
        setShowTicketModal(true);
    };

    const archiveTicket = async (id) => {
        if (!window.confirm('Archive this ticket? Media files will be deleted.')) return;
        try {
            await api.post(`/equipment-borrowing/tickets/${id}/archive`);
            loadTickets(activeTab);
            if (showTicketModal) setShowTicketModal(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to archive');
        }
    };

    const copyLink = (regulationId) => {
        const link = `${window.location.origin}/borrow/${regulationId}`;
        navigator.clipboard.writeText(link);
        alert('Link copied!');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('he-IL');
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                {[
                    { id: 'open', label: 'Open Tickets', icon: 'fa-ticket-alt' },
                    { id: 'archived', label: 'Archive', icon: 'fa-archive' },
                    { id: 'regulations', label: 'Regulations', icon: 'fa-file-contract' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-white text-brand-red shadow'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <i className={`fas ${tab.icon} mr-2`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Action button */}
            {activeTab === 'regulations' && (
                <div className="mb-4">
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700"
                    >
                        <i className="fas fa-plus mr-2"></i> Create Regulation
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : activeTab === 'regulations' ? (
                /* Regulations View */
                <div className="grid gap-4">
                    {regulations.map(reg => (
                        <div key={reg.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{reg.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${reg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {reg.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {reg.open_count} open / {reg.ticket_count} total tickets
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => copyLink(reg.id)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                        <i className="fas fa-link mr-1"></i> Copy Link
                                    </button>
                                    <button onClick={() => handleEdit(reg)} className="p-2 text-brand-red border rounded">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    {user?.role === 'Admin' && (
                                        <button onClick={() => handleDelete(reg.id)} className="p-2 text-red-600 border rounded">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {regulations.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500">No regulations created yet</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Tickets View */
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{ticket.first_name} {ticket.last_name}</div>
                                        <div className="text-sm text-gray-500">{ticket.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{ticket.company_name || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{ticket.equipment_name}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(ticket.signed_at)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${ticket.status === 'open'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => viewTicket(ticket)} className="text-brand-red hover:text-red-800">
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        {ticket.status === 'open' && (
                                            <button onClick={() => archiveTicket(ticket.id)} className="text-orange-600 hover:text-orange-900" title="Archive">
                                                <i className="fas fa-archive"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tickets.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No {activeTab} tickets
                        </div>
                    )}
                </div>
            )}

            {/* Regulation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {isEditing ? 'Edit Regulation' : 'Create Regulation'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="mt-1 w-full border rounded-md p-2"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Regulation Text *</label>
                                <textarea
                                    name="regulationText"
                                    required
                                    rows="8"
                                    className="mt-1 w-full border rounded-md p-2"
                                    value={formData.regulationText}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    id="isActive"
                                    className="h-4 w-4"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm">Active</label>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-red text-white rounded-md">
                                    {isEditing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Details Modal */}
            {showTicketModal && currentTicket && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Ticket Details</h3>
                            <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="font-medium text-gray-500">Name</label>
                                <p>{currentTicket.first_name} {currentTicket.last_name}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-500">Company</label>
                                <p>{currentTicket.company_name || '-'}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-500">Phone</label>
                                <p>{currentTicket.phone}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-500">ID Number</label>
                                <p>{currentTicket.id_number || '-'}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="font-medium text-gray-500">Equipment</label>
                                <p>{currentTicket.equipment_name}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-500">Signed At</label>
                                <p>{formatDate(currentTicket.signed_at)}</p>
                            </div>
                            <div>
                                <label className="font-medium text-gray-500">Status</label>
                                <p>{currentTicket.status}</p>
                            </div>
                            {currentTicket.status === 'archived' && (
                                <>
                                    <div>
                                        <label className="font-medium text-gray-500">Closed By</label>
                                        <p>{currentTicket.closed_by_username}</p>
                                    </div>
                                    <div>
                                        <label className="font-medium text-gray-500">Closed At</label>
                                        <p>{formatDate(currentTicket.closed_at)}</p>
                                    </div>
                                </>
                            )}
                            {currentTicket.signature_data && (
                                <div className="col-span-2">
                                    <label className="font-medium text-gray-500">Signature</label>
                                    <img src={currentTicket.signature_data} alt="Signature" className="h-20 border rounded mt-1" />
                                </div>
                            )}
                            {currentTicket.id_photo_url && (
                                <div>
                                    <label className="font-medium text-gray-500">ID Photo</label>
                                    <img
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${currentTicket.id_photo_url}`}
                                        alt="ID"
                                        className="h-24 border rounded mt-1 cursor-pointer"
                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${currentTicket.id_photo_url}`, '_blank')}
                                    />
                                </div>
                            )}
                            {currentTicket.equipment_photo_url && (
                                <div>
                                    <label className="font-medium text-gray-500">Equipment Photo</label>
                                    <img
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${currentTicket.equipment_photo_url}`}
                                        alt="Equipment"
                                        className="h-24 border rounded mt-1 cursor-pointer"
                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${currentTicket.equipment_photo_url}`, '_blank')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            {currentTicket.status === 'open' && (
                                <button
                                    onClick={() => archiveTicket(currentTicket.id)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                                >
                                    <i className="fas fa-archive mr-2"></i> Archive Ticket
                                </button>
                            )}
                            <button onClick={() => setShowTicketModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentBorrowing;
