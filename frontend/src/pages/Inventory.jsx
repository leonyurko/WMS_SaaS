import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { fetchInventory, createInventory, updateInventory, deleteInventory } from '../services/inventoryService';
import api from '../services/api';

const Inventory = () => {
  const { setPageTitle } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Advanced Search State
  const [warehouseFilter, setWarehouseFilter] = useState(searchParams.get('warehouse') || '');
  const [shelfFilter, setShelfFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState('');
  const [partNumberFilter, setPartNumberFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [categories, setCategories] = useState([]);

  // Layout State
  const [layouts, setLayouts] = useState({ Small: [], Large: [] });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    shelf: '',
    shelfColumn: '',
    quantity: 0,
    location: '', // Warehouse
    minQuantity: 5,
    images: []
  });

  // Gallery modal state
  const [galleryItem, setGalleryItem] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setPageTitle('Inventory');
    loadInventory();
    loadCategories();
    fetchLayouts();
  }, [setPageTitle, statusFilter, warehouseFilter, shelfFilter, columnFilter, partNumberFilter]);

  const fetchLayouts = async () => {
    try {
      const [smallRes, largeRes] = await Promise.all([
        api.get('/layouts/Small'),
        api.get('/layouts/Large')
      ]);
      setLayouts({
        Small: smallRes.data.data.structure || [],
        Large: largeRes.data.data.structure || []
      });
    } catch (err) {
      console.error('Failed to fetch layouts', err);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await fetchInventory({
        search,
        status: statusFilter,
        warehouse: warehouseFilter,
        shelf: shelfFilter,
        shelfColumn: columnFilter,
        partNumber: partNumberFilter
      });
      setInventory(data.items);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.status === 'success') {
        setCategories(response.data.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const subCategories = categories.filter(c => c.parent_id === formData.categoryId);

  // Helper for dynamic dropdowns
  const searchRows = warehouseFilter ? layouts[warehouseFilter] || [] : [];
  const searchCols = (warehouseFilter && shelfFilter) ? searchRows.find(r => r.name === shelfFilter)?.columnNames || [] : [];

  const formRows = formData.location ? layouts[formData.location] || [] : [];
  const formCols = (formData.location && formData.shelf) ? formRows.find(r => r.name === formData.shelf)?.columnNames || [] : [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset subcategory if category changes
      if (name === 'categoryId') {
        newData.subCategoryId = '';
      }
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // Max 5 images
    setFormData(prev => ({ ...prev, images: files }));
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', categoryId: '', subCategoryId: '', shelf: '', shelfColumn: '',
      quantity: 0, location: '', minQuantity: 5, images: []
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      categoryId: item.category_id || '',
      subCategoryId: item.sub_category_id || '',
      shelf: item.shelf || '',
      shelfColumn: item.shelf_column || '',
      quantity: item.current_stock,
      location: item.location || '',
      minQuantity: item.min_threshold,
      images: []
    });
    setCurrentId(item.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteInventory(id);
      loadInventory();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleDeleteImage = async (itemId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      // Get current item
      const item = inventory.find(i => i.id === itemId);
      let imageUrls = item.image_urls || [];

      console.log('🔍 Before delete - image_urls:', imageUrls);
      console.log('🔍 Before delete - image_url:', item.image_url);
      console.log('🔍 Deleting:', imageUrl);

      // Remove the image from the array
      imageUrls = imageUrls.filter(img => img !== imageUrl);

      // Determine new primary image
      let newImageUrl = item.image_url;

      // If we are deleting the current primary image
      if (item.image_url === imageUrl) {
        // Set the first available image as primary, or null if no images left
        newImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
      } else if (!newImageUrl && imageUrls.length > 0) {
        // If there was no primary image but we have images, set one
        newImageUrl = imageUrls[0];
      }

      console.log('🔍 After delete - new image_urls:', imageUrls);
      console.log('🔍 After delete - new image_url:', newImageUrl);

      // Update the item with all required fields (use camelCase for backend)
      const response = await api.put(`/inventory/${itemId}`, {
        name: item.name,
        location: item.location,
        categoryId: item.category_id,
        subCategoryId: item.sub_category_id,
        shelf: item.shelf,
        description: item.description,
        minThreshold: item.min_threshold,
        imageUrl: newImageUrl,
        imageUrls: imageUrls  // camelCase, not image_urls
      });

      console.log('🔍 Server response:', response.data.data.item);
      console.log('🔍 Response image_urls:', response.data.data.item.image_urls);
      console.log('🔍 Response image_url:', response.data.data.item.image_url);

      // Close and reopen the gallery to force a fresh render
      setShowGallery(false);
      setGalleryItem(null);

      // Reload inventory list
      await loadInventory();

      // Small delay to ensure state updates, then reopen gallery with fresh data
      setTimeout(() => {
        setGalleryItem(response.data.data.item);
        setShowGallery(true);
      }, 100);

      alert('Image deleted successfully');
    } catch (err) {
      alert('Failed to delete image: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (formData.subCategoryId) data.append('subCategoryId', formData.subCategoryId);
      if (formData.shelf) data.append('shelf', formData.shelf);
      if (formData.shelfColumn) data.append('shelfColumn', formData.shelfColumn);
      data.append('location', formData.location);
      data.append('minThreshold', formData.minQuantity);

      // Append multiple images
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(img => {
          data.append('images', img);
        });
      }

      if (isEditing) {
        await updateInventory(currentId, data);
        alert('Item updated successfully');
      } else {
        data.append('currentStock', formData.quantity);
        await createInventory(data);
        alert('Item added successfully');
      }

      setShowModal(false);
      resetForm();
      loadInventory();
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    }
  };

  const openGallery = (item) => {
    setGalleryItem(item);
    setShowGallery(true);
  };

  const printItem = (item) => {
    const printWindow = window.open('', '_blank');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print: ${item.name}</title>
        <style>
          @media print {
            @page { margin: 0.5in; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .item-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .detail-row {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
          }
          .detail-value {
            font-size: 16px;
            margin-top: 5px;
          }
          .codes {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .code-item {
            text-align: center;
          }
          .code-item img {
            max-width: 200px;
            height: auto;
          }
          .code-label {
            font-weight: bold;
            margin-top: 10px;
            font-size: 14px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="item-name">${item.name}</div>
          <div>${item.category_name || ''} ${item.sub_category_name ? '/ ' + item.sub_category_name : ''}</div>
        </div>

        <div class="item-details">
          <div class="detail-row">
            <div class="detail-label">Location</div>
            <div class="detail-value">${item.location}${item.shelf ? ' - ' + item.shelf : ''}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Barcode</div>
            <div class="detail-value">${item.barcode}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Current Stock</div>
            <div class="detail-value">${item.current_stock}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Min Threshold</div>
            <div class="detail-value">${item.min_threshold}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Status</div>
            <div class="detail-value">${item.status}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Description</div>
            <div class="detail-value">${item.description || 'N/A'}</div>
          </div>
        </div>

        ${item.barcode_image_url || item.qr_image_url ? `
          <div class="codes">
            ${item.barcode_image_url ? `
              <div class="code-item">
                <img src="${window.location.origin}${item.barcode_image_url}" alt="Barcode" />
                <div class="code-label">Barcode</div>
              </div>
            ` : ''}
            ${item.qr_image_url ? `
              <div class="code-item">
                <img src="${window.location.origin}${item.qr_image_url}" alt="QR Code" />
                <div class="code-label">QR Code</div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>

        <script>
          // Auto-print on mobile
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => window.print(), 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExport = () => {
    if (!inventory.length) return;

    const headers = ['Name', 'Barcode', 'Location', 'Category', 'Sub Category', 'Shelf', 'Stock', 'Min Threshold', 'Status'];
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        `"${item.name}"`,
        item.barcode,
        `"${item.location}"`,
        `"${item.category_name || ''}"`,
        `"${item.sub_category_name || ''}"`,
        `"${item.shelf || ''}"`,
        item.current_stock,
        item.min_threshold,
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'In Stock': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800',
      'Out of Stock': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border rounded"
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setShelfFilter('');
              setColumnFilter('');
            }}
          >
            <option value="">All Warehouses</option>
            <option value="Small">Small Warehouse</option>
            <option value="Large">Large Warehouse</option>
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={shelfFilter}
            onChange={(e) => {
              setShelfFilter(e.target.value);
              setColumnFilter('');
            }}
            disabled={!warehouseFilter}
          >
            <option value="">All Rows</option>
            {searchRows.map((r, i) => (
              <option key={i} value={r.name}>{r.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={columnFilter}
            onChange={(e) => setColumnFilter(e.target.value)}
            disabled={!shelfFilter}
          >
            <option value="">All Columns</option>
            {searchCols.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Part/Product..."
            className="px-3 py-2 border rounded"
            value={partNumberFilter}
            onChange={(e) => setPartNumberFilter(e.target.value)}
          />
          <select
            className="px-3 py-2 border rounded"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div className="flex justify-end mt-4 space-x-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <i className="fas fa-file-export mr-2"></i> Export CSV
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => {
                  const images = item.image_urls || [];
                  const hasMultipleImages = images.length > 1;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {item.image_url || images.length > 0 ? (
                          <div className="relative">
                            <img
                              src={images[0] || item.image_url}
                              alt={item.name}
                              className="h-10 w-10 object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-500"
                              onClick={() => openGallery(item)}
                            />
                            {hasMultipleImages && (
                              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {images.length}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {item.barcode_image_url ? (
                          <img
                            src={item.barcode_image_url}
                            alt="Barcode"
                            className="h-8 w-auto cursor-pointer hover:ring-2 hover:ring-blue-500"
                            onClick={() => window.open(item.barcode_image_url, '_blank')}
                          />
                        ) : (
                          <span className="font-mono text-sm">{item.barcode}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.qr_image_url ? (
                          <img
                            src={item.qr_image_url}
                            alt="QR Code"
                            className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-blue-500"
                            onClick={() => window.open(item.qr_image_url, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>{item.location}</div>
                        {item.shelf && <div className="text-xs text-gray-500">Shelf: {item.shelf}</div>}
                      </td>
                      <td className="px-6 py-4 font-semibold">{item.current_stock}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => printItem(item)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows="2"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="categoryId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                  <select
                    name="subCategoryId"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.subCategoryId}
                    onChange={handleInputChange}
                    disabled={!formData.categoryId || subCategories.length === 0}
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                  <select
                    name="location"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.location}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData(prev => ({ ...prev, shelf: '', shelfColumn: '' }));
                    }}
                  >
                    <option value="">Select Warehouse</option>
                    <option value="Small">Small Warehouse</option>
                    <option value="Large">Large Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Row (Shelf)</label>
                  <select
                    name="shelf"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.shelf}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData(prev => ({ ...prev, shelfColumn: '' }));
                    }}
                    disabled={!formData.location}
                  >
                    <option value="">Select Row</option>
                    {formRows.map((r, i) => (
                      <option key={i} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Column</label>
                  <select
                    name="shelfColumn"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.shelfColumn}
                    onChange={handleInputChange}
                    disabled={!formData.shelf}
                  >
                    <option value="">Select Column</option>
                    {formCols.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {isEditing ? 'Current Stock (Read Only)' : 'Initial Quantity'}
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    required
                    disabled={isEditing}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 ${isEditing ? 'bg-gray-100' : ''}`}
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Threshold</label>
                  <input
                    type="number"
                    name="minQuantity"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.minQuantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Images (up to 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
                {formData.images.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">{formData.images.length} file(s) selected</p>
                )}
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
                  {isEditing ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && galleryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-semibold text-gray-900">{galleryItem.name}</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="block text-xs text-gray-500 uppercase font-semibold">Location</span>
                  <span className="text-lg">{galleryItem.location}{galleryItem.shelf ? ` - ${galleryItem.shelf}` : ''}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="block text-xs text-gray-500 uppercase font-semibold">Stock</span>
                  <span className="text-lg font-bold">{galleryItem.current_stock}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="block text-xs text-gray-500 uppercase font-semibold">Category</span>
                  <span className="text-lg">{galleryItem.category_name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="block text-xs text-gray-500 uppercase font-semibold">Status</span>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(galleryItem.status)}`}>
                    {galleryItem.status}
                  </span>
                </div>
              </div>

              {/* Images Grid */}
              {(() => {
                // Create a NEW array to avoid mutating galleryItem.image_urls
                let images = [...(galleryItem.image_urls || [])];
                if (galleryItem.image_url && !images.includes(galleryItem.image_url)) {
                  images = [galleryItem.image_url, ...images];
                }

                return images.length > 0 ? (
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700">Product Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="aspect-square relative group">
                          <img
                            src={img}
                            alt={`${galleryItem.name} - ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-75 transition"
                            onClick={() => window.open(img, '_blank')}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(galleryItem.id, img);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                            title="Delete image"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-image text-4xl mb-2"></i>
                    <p>No images available</p>
                  </div>
                );
              })()}

              {/* Barcode and QR Code */}
              {(galleryItem.barcode_image_url || galleryItem.qr_image_url) && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-700">Codes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {galleryItem.barcode_image_url && (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Barcode</p>
                        <img
                          src={galleryItem.barcode_image_url}
                          alt="Barcode"
                          className="mx-auto max-h-20 cursor-pointer hover:opacity-75"
                          onClick={() => window.open(galleryItem.barcode_image_url, '_blank')}
                        />
                        <p className="text-xs text-gray-500 mt-2 font-mono">{galleryItem.barcode}</p>
                      </div>
                    )}
                    {galleryItem.qr_image_url && (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-600 mb-2">QR Code</p>
                        <img
                          src={galleryItem.qr_image_url}
                          alt="QR Code"
                          className="mx-auto max-h-32 cursor-pointer hover:opacity-75"
                          onClick={() => window.open(galleryItem.qr_image_url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {galleryItem.description && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-2 text-gray-700">Description</h4>
                  <p className="text-gray-600">{galleryItem.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
