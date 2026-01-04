import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import categoryService from '../services/categoryService';
import useAuthStore from '../stores/authStore';

const Categories = () => {
    const { setPageTitle } = useOutletContext();
    const { user } = useAuthStore();
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]); // For parent selector
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: ''
    });

    useEffect(() => {
        setPageTitle('Category Management');
        loadCategories();
    }, [setPageTitle]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            // Get hierarchical for display, flat for selector (or just flatten it manually? API supports both)
            // Let's get hierarchical for the table
            const response = await categoryService.getAllCategories(true);

            // Also get flat for the parent dropdown
            const flatResponse = await categoryService.getAllCategories(false);

            if (response.data.status === 'success') {
                setCategories(response.data.data.categories);
            }
            if (flatResponse.data.status === 'success') {
                setFlatCategories(flatResponse.data.data.categories);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', parentId: '' });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleEdit = (category, parentId = null) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            parentId: parentId || category.parent_id || ''
        });
        setCurrentId(category.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This category must have no subcategories.')) return;
        try {
            await categoryService.deleteCategory(id);
            loadCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                parentId: formData.parentId || null
            };

            if (isEditing) {
                await categoryService.updateCategory(currentId, dataToSend);
            } else {
                await categoryService.createCategory(dataToSend);
            }
            setShowModal(false);
            resetForm();
            loadCategories();
        } catch (err) {
            alert('Failed to save category');
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                    <i className="fas fa-plus mr-2"></i> Add Category
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categories.map((cat) => (
                                <>
                                    {/* Parent Category Row */}
                                    <tr key={cat.id} className="bg-gray-50 font-medium">
                                        <td className="px-6 py-4">{cat.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{cat.description}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 uppercase tracking-wider">Main</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(cat)} className="text-brand-red hover:text-red-900">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Subcategories */}
                                    {cat.subcategories && cat.subcategories.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 pl-10 border-l-4 border-l-transparent text-gray-700">
                                                <i className="fas fa-level-up-alt rotate-90 mr-2 text-gray-400"></i>
                                                {sub.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{sub.description}</td>
                                            <td className="px-6 py-4 text-xs text-gray-400">Sub</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleEdit(sub, cat.id)} className="text-brand-red hover:text-red-900">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:text-red-900">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">No categories found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {isEditing ? 'Edit Category' : 'Add Category'}
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    rows="2"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Category (Optional)</label>
                                <select
                                    name="parentId"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red border p-2"
                                    value={formData.parentId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">-- Main Category --</option>
                                    {flatCategories
                                        .filter(c => !c.parent_id && c.id !== currentId) // Only show main categories and prevent self-parenting
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))
                                    }
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Select logic: Subcategories cannot be parents.</p>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-red text-white rounded-md hover:bg-red-700">
                                    {isEditing ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
