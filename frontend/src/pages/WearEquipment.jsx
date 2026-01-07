import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import {
    fetchWearReports,
    fetchWearStats,
    createWearReport,
    resolveWearReport,
    archiveWearReport,
    uploadWearMedia,
    removeWearMedia,
    createWearReport,
    updateWearReport,
    resolveWearReport,
    archiveWearReport,
    uploadWearMedia,
    removeWearMedia,
    deleteWearReport
} from '../services/wearEquipmentService';
import { fetchInventory } from '../services/inventoryService';
import api from '../services/api';

const WearEquipment = () => {
    const { setPageTitle } = useOutletContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('open');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [inventorySearch, setInventorySearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        inventoryId: '',
        severity: 'medium',
        description: '',
        media: []
    });

    useEffect(() => {
        setPageTitle('Wear Equipment');
        loadData();
    }, [setPageTitle]);

    // Handle URL params for pre-selecting item (separate effect to avoid function order issues)
    useEffect(() => {
        const itemId = searchParams.get('itemId');
        const itemName = searchParams.get('itemName');
        if (itemId) {
            // Load inventory and open modal with pre-selected item
            const openWithItem = async () => {
                try {
                    const data = await fetchInventory({ search: itemName || '' });
                    const items = data?.items || [];
                    setInventoryItems(items);
                    setFormData({ inventoryId: itemId, severity: 'medium', description: '', media: [] });
                    setShowModal(true);
                    // Clear URL params
                    setSearchParams({});
                } catch (err) {
                    console.error('Failed to open modal with item:', err);
                }
            };
            openWithItem();
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (activeTab) {
            loadReports();
        }
    }, [activeTab, debouncedSearch]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reportsData, statsData] = await Promise.all([
                fetchWearReports({
                    status: activeTab === 'all' ? undefined : activeTab,
                    search: debouncedSearch
                }),
                fetchWearStats()
            ]);
            setReports(reportsData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load wear reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadReports = async () => {
        try {
            const reportsData = await fetchWearReports({
                status: activeTab === 'all' ? undefined : activeTab,
                search: debouncedSearch
            });
            setReports(reportsData || []);
        } catch (err) {
            console.error('Failed to load wear reports:', err);
        }
    };

    const loadInventory = async (search = '') => {
        try {
            const data = await fetchInventory({ search });
            const items = data?.items || [];
            setInventoryItems(items);
            return items;
        } catch (err) {
            console.error('Failed to load inventory:', err);
            return [];
        }
    };

    const handleOpenModal = async () => {
        await loadInventory();
        setFormData({ inventoryId: '', severity: 'medium', description: '', media: [] });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = async (report) => {
        await loadInventory(); // Ensure items are loaded to show the name (though we might disable select)
        setFormData({
            inventoryId: report.inventory_id,
            severity: report.severity,
            description: report.description || '',
            media: [] // Media update not supported in this form
        });
        setEditingId(report.id);
        setShowModal(true);
    };

    const handleOpenModalWithItem = async (itemId, itemName) => {
        const items = await loadInventory(itemName || '');
        setFormData({ inventoryId: itemId, severity: 'medium', description: '', media: [] });
        setInventoryItems(items);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.inventoryId) {
            alert('Please select an inventory item');
            return;
        }
        try {
            if (editingId) {
                await updateWearReport(editingId, {
                    severity: formData.severity,
                    description: formData.description
                });
            } else {
                await createWearReport(formData);
            }
            setShowModal(false);
            setEditingId(null);
            loadData();
        } catch (err) {
            alert(`Failed to ${editingId ? 'update' : 'create'} wear report: ` + (err.response?.data?.message || err.message));
        }
    };

    const handleResolve = async (id) => {
        if (!window.confirm('Mark this report as resolved?')) return;
        try {
            await resolveWearReport(id);
            loadData();
        } catch (err) {
            alert('Failed to resolve: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Archive this report?')) return;
        try {
            await archiveWearReport(id);
            loadData();
        } catch (err) {
            alert('Failed to archive: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report permanently?')) return;
        try {
            await deleteWearReport(id);
            loadData();
        } catch (err) {
            alert('Failed to delete: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
        setShowDetailModal(true);
    };

    const handleUploadMedia = async (reportId, file) => {
        try {
            await uploadWearMedia(reportId, file);
            // Refresh the selected report
            const updatedReports = await fetchWearReports({ status: activeTab === 'all' ? undefined : activeTab });
            setReports(updatedReports || []);
            const updated = updatedReports.find(r => r.id === reportId);
            if (updated) setSelectedReport(updated);
        } catch (err) {
            alert('Failed to upload media: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRemoveMedia = async (reportId, mediaUrl) => {
        if (!window.confirm('Remove this image?')) return;
        try {
            await removeWearMedia(reportId, mediaUrl);
            const updatedReports = await fetchWearReports({ status: activeTab === 'all' ? undefined : activeTab });
            setReports(updatedReports || []);
            const updated = updatedReports.find(r => r.id === reportId);
            if (updated) setSelectedReport(updated);
        } catch (err) {
            alert('Failed to remove media: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setFormData(prev => ({ ...prev, media: files }));
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            critical: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-green-100 text-green-800 border-green-200'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[severity] || colors.medium}`}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.open}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getApiBaseUrl = () => {
        return api.defaults.baseURL?.replace('/api', '') || '';
    };

    return (
        <div>
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                        <div className="text-2xl font-bold text-red-600">{stats.critical_count || 0}</div>
                        <div className="text-sm text-gray-600">Critical</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                        <div className="text-2xl font-bold text-orange-600">{stats.high_count || 0}</div>
                        <div className="text-sm text-gray-600">High</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                        <div className="text-2xl font-bold text-yellow-600">{stats.medium_count || 0}</div>
                        <div className="text-sm text-gray-600">Medium</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                        <div className="text-2xl font-bold text-green-600">{stats.low_count || 0}</div>
                        <div className="text-sm text-gray-600">Low</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="text-2xl font-bold text-blue-600">{stats.total_open || 0}</div>
                        <div className="text-sm text-gray-600">Total Open</div>
                    </div>
                </div>
            )}

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'open', label: 'Open', icon: 'fa-exclamation-circle' },
                        { id: 'resolved', label: 'Resolved', icon: 'fa-check-circle' },
                        { id: 'archived', label: 'Archived', icon: 'fa-archive' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white text-brand-red shadow'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <i className={`fas ${tab.icon} mr-2`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleOpenModal}
                    className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Report Wear
                </button>
            </div>



            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <input
                    type="text"
                    placeholder="Search reports (Item, Description, User)..."
                    className="w-full border rounded-md px-3 py-2 focus:ring-brand-red focus:border-brand-red"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Reports List */}
            {
                loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        <i className="fas fa-tools text-4xl mb-4 text-gray-300"></i>
                        <p>No {activeTab} wear reports found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {reports.map(report => (
                            <div key={report.id} className="border-b border-gray-200 last:border-0 p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        {/* Item Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {report.item_image_url ? (
                                                <img
                                                    src={`${getApiBaseUrl()}${report.item_image_url}`}
                                                    alt={report.item_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <i className="fas fa-box text-2xl"></i>
                                                </div>
                                            )}
                                        </div>
                                        {/* Details */}
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="font-semibold text-gray-800">{report.item_name}</h3>
                                                {getSeverityBadge(report.severity)}
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                {report.description || 'No description provided'}
                                            </p>
                                            <div className="text-xs text-gray-500">
                                                <span>Reported by {report.reported_by_username}</span>
                                                <span className="mx-2">•</span>
                                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                                {report.media_urls?.length > 0 && (
                                                    <>
                                                        <span className="mx-2">•</span>
                                                        <span><i className="fas fa-image mr-1"></i>{report.media_urls.length} photo(s)</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleViewReport(report)}
                                            className="p-2 text-brand-red hover:bg-red-50 rounded"
                                            title="View Details"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(report)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Edit"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            title="Delete"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                        {report.status === 'open' && (
                                            <button
                                                onClick={() => handleResolve(report.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                title="Mark Resolved"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        )}
                                        {report.status !== 'archived' && (
                                            <button
                                                onClick={() => handleArchive(report.id)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Archive"
                                            >
                                                <i className="fas fa-archive"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Create Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-lg font-semibold">{editingId ? 'Edit Wear Report' : 'Report Wear'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4">
                                {/* Inventory Search */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Item *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search inventory..."
                                        value={inventorySearch}
                                        onChange={async (e) => {
                                            setInventorySearch(e.target.value);
                                            await loadInventory(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red mb-2"
                                    />
                                    <select
                                        value={formData.inventoryId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, inventoryId: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red disabled:bg-gray-100"
                                        required
                                        disabled={!!editingId}
                                    >
                                        <option value="">-- Select Item --</option>
                                        {inventoryItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} ({item.barcode})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Severity */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Severity *
                                    </label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red"
                                        required
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red"
                                        rows={3}
                                        placeholder="Describe the wear or damage..."
                                    />
                                </div>

                                {/* Media Upload */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Photos (up to 5)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    {formData.media.length > 0 && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            {formData.media.length} file(s) selected
                                        </div>
                                    )}
                                    {editingId && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            * To manage photos, save changes and use the Detail View.
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700"
                                    >
                                        {editingId ? 'Update Report' : 'Create Report'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Detail Modal */}
            {
                showDetailModal && selectedReport && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                                <h2 className="text-lg font-semibold">Wear Report Details</h2>
                                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="p-4">
                                {/* Item Info */}
                                <div className="flex items-center space-x-4 mb-4 pb-4 border-b">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                        {selectedReport.item_image_url ? (
                                            <img
                                                src={`${getApiBaseUrl()}${selectedReport.item_image_url}`}
                                                alt={selectedReport.item_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <i className="fas fa-box text-3xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{selectedReport.item_name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Barcode: {selectedReport.barcode} • Location: {selectedReport.item_location}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            {getSeverityBadge(selectedReport.severity)}
                                            {getStatusBadge(selectedReport.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                                    <p className="text-gray-600">{selectedReport.description || 'No description provided'}</p>
                                </div>

                                {/* Reporter Info */}
                                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Reported by:</span>
                                        <span className="ml-2 font-medium">{selectedReport.reported_by_username}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Date:</span>
                                        <span className="ml-2">{new Date(selectedReport.created_at).toLocaleString()}</span>
                                    </div>
                                    {selectedReport.resolved_by_username && (
                                        <>
                                            <div>
                                                <span className="text-gray-500">Resolved by:</span>
                                                <span className="ml-2 font-medium">{selectedReport.resolved_by_username}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Resolved at:</span>
                                                <span className="ml-2">{new Date(selectedReport.resolved_at).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Media Gallery */}
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 mb-2">Photos</h4>
                                    {selectedReport.media_urls?.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedReport.media_urls.map((url, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={`${getApiBaseUrl()}${url}`}
                                                        alt={`Wear photo ${idx + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                                        onClick={() => window.open(`${getApiBaseUrl()}${url}`, '_blank')}
                                                    />
                                                    {selectedReport.status === 'open' && (
                                                        <button
                                                            onClick={() => handleRemoveMedia(selectedReport.id, url)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <i className="fas fa-times text-xs"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">No photos attached</p>
                                    )}

                                    {/* Upload more */}
                                    {selectedReport.status === 'open' && (
                                        <div className="mt-3">
                                            <label className="cursor-pointer text-brand-red hover:text-red-700 text-sm">
                                                <i className="fas fa-plus mr-1"></i> Add Photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            handleUploadMedia(selectedReport.id, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    {selectedReport.status === 'open' && (
                                        <button
                                            onClick={() => {
                                                handleResolve(selectedReport.id);
                                                setShowDetailModal(false);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <i className="fas fa-check mr-2"></i>Mark Resolved
                                        </button>
                                    )}
                                    {selectedReport.status !== 'archived' && (
                                        <button
                                            onClick={() => {
                                                handleArchive(selectedReport.id);
                                                setShowDetailModal(false);
                                            }}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                        >
                                            <i className="fas fa-archive mr-2"></i>Archive
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default WearEquipment;
