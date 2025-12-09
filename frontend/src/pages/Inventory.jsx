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
    images: [],
    additionalLocations: [],
    locationDetails: ''
  });

  // Column Builder State for Main Location
  const [mainColumnBuilder, setMainColumnBuilder] = useState([{ id: 'init', value: '', relation: 'To' }]);

  // Gallery modal state
  const [galleryItem, setGalleryItem] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setPageTitle('Inventory');
    loadInventory();
    loadCategories();
    fetchLayouts();
  }, [setPageTitle, statusFilter, warehouseFilter, shelfFilter, columnFilter, partNumberFilter]);

  // Sync mainColumnBuilder to formData.shelfColumn
  useEffect(() => {
    if (mainColumnBuilder.length === 0) {
      setFormData(prev => ({ ...prev, shelfColumn: '' }));
      return;
    }
    const str = mainColumnBuilder.map((item, index) => {
      if (index === 0) return item.value;
      return `${item.relation} ${item.value}`;
    }).join(' ');
    setFormData(prev => ({ ...prev, shelfColumn: str }));
  }, [mainColumnBuilder]);

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

  // Dynamic Location Helpers
  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      additionalLocations: [...prev.additionalLocations, {
        warehouse: '',
        shelf: '',
        shelfColumn: '',
        columnBuilder: [{ id: Date.now(), value: '', relation: 'To' }]
      }]
    }));
  };

  const removeLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalLocations: prev.additionalLocations.filter((_, i) => i !== index)
    }));
  };

  const handleLocationChange = (index, field, value) => {
    setFormData(prev => {
      const newLocations = [...prev.additionalLocations];
      newLocations[index] = { ...newLocations[index], [field]: value };

      // Reset dependent fields
      if (field === 'warehouse') {
        newLocations[index].shelf = '';
        newLocations[index].shelfColumn = '';
        newLocations[index].columnBuilder = [{ id: Date.now(), value: '', relation: 'To' }];
      } else if (field === 'shelf') {
        newLocations[index].shelfColumn = '';
        newLocations[index].columnBuilder = [{ id: Date.now(), value: '', relation: 'To' }];
      }

      return { ...prev, additionalLocations: newLocations };
    });
  };

  // Column Builder Helpers
  const parseColumnString = (str) => {
    if (!str) return [{ id: Date.now(), value: '', relation: 'To' }];
    const parts = str.split(/( To | And )/g);
    const builder = [];
    let currentRelation = 'To';

    parts.forEach((part, i) => {
      if (part.trim() === 'To' || part.trim() === 'And') {
        currentRelation = part.trim();
      } else {
        if (builder.length === 0) {
          builder.push({ id: Date.now() + i, value: part.trim(), relation: 'To' });
        } else {
          builder.push({ id: Date.now() + i, value: part.trim(), relation: currentRelation });
        }
      }
    });
    return builder.length > 0 ? builder : [{ id: Date.now(), value: '', relation: 'To' }];
  };

  const updateMainColumnBuilder = (index, field, value) => {
    setMainColumnBuilder(prev => {
      const newBuilder = [...prev];
      newBuilder[index] = { ...newBuilder[index], [field]: value };
      return newBuilder;
    });
  };

  const addMainColumn = () => {
    setMainColumnBuilder(prev => [...prev, { id: Date.now(), value: '', relation: 'To' }]);
  };

  const removeMainColumn = (index) => {
    setMainColumnBuilder(prev => prev.filter((_, i) => i !== index));
  };

  const updateAddLocationColumnBuilder = (locIndex, colIndex, field, value) => {
    setFormData(prev => {
      const newLocations = [...prev.additionalLocations];
      const newBuilder = [...(newLocations[locIndex].columnBuilder || [{ id: Date.now(), value: '', relation: 'To' }])];
      newBuilder[colIndex] = { ...newBuilder[colIndex], [field]: value };
      newLocations[locIndex].columnBuilder = newBuilder;

      const str = newBuilder.map((item, idx) => {
        if (idx === 0) return item.value;
        return `${item.relation} ${item.value}`;
      }).join(' ');
      newLocations[locIndex].shelfColumn = str;

      return { ...prev, additionalLocations: newLocations };
    });
  };

  const addAddLocationColumn = (locIndex) => {
    setFormData(prev => {
      const newLocations = [...prev.additionalLocations];
      const currentBuilder = newLocations[locIndex].columnBuilder || [{ id: Date.now(), value: '', relation: 'To' }];
      newLocations[locIndex].columnBuilder = [
        ...currentBuilder,
        { id: Date.now(), value: '', relation: 'To' }
      ];
      return { ...prev, additionalLocations: newLocations };
    });
  };

  const removeAddLocationColumn = (locIndex, colIndex) => {
    setFormData(prev => {
      const newLocations = [...prev.additionalLocations];
      const currentBuilder = newLocations[locIndex].columnBuilder || [];
      const newBuilder = currentBuilder.filter((_, i) => i !== colIndex);
      newLocations[locIndex].columnBuilder = newBuilder;

      const str = newBuilder.map((item, idx) => {
        if (idx === 0) return item.value;
        return `${item.relation} ${item.value}`;
      }).join(' ');
      newLocations[locIndex].shelfColumn = str;

      return { ...prev, additionalLocations: newLocations };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', categoryId: '', subCategoryId: '', shelf: '', shelfColumn: '',
      quantity: 0, location: '', minQuantity: 5, images: [], additionalLocations: [], locationDetails: ''
    });
    setMainColumnBuilder([{ id: 'init', value: '', relation: 'To' }]);
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
      images: [],
      additionalLocations: (item.additional_locations || []).map(loc => ({
        ...loc,
        columnBuilder: parseColumnString(loc.shelfColumn)
      })),
      locationDetails: item.location_details || ''
    });
    setMainColumnBuilder(parseColumnString(item.shelf_column));
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
      const item = inventory.find(i => i.id === itemId);
      let imageUrls = item.image_urls || [];
      imageUrls = imageUrls.filter(img => img !== imageUrl);
      let newImageUrl = item.image_url;
      if (item.image_url === imageUrl) {
        newImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
      } else if (!newImageUrl && imageUrls.length > 0) {
        newImageUrl = imageUrls[0];
      }

      const response = await api.put(`/inventory/${itemId}`, {
        name: item.name,
        location: item.location,
        categoryId: item.category_id,
        subCategoryId: item.sub_category_id,
        shelf: item.shelf,
        description: item.description,
        minThreshold: item.min_threshold,
        imageUrl: newImageUrl,
        imageUrls: imageUrls
      });

      setShowGallery(false);
      setGalleryItem(null);
      await loadInventory();
      setTimeout(() => {
        setGalleryItem(response.data.data.item);
        setShowGallery(true);
      }, 100);
      alert('Image deleted successfully');
    } catch (err) {
      alert('Failed to delete image: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = () => {
    if (inventory.length === 0) {
      alert('No items to export');
      return;
    }

    const headers = ['Name', 'Category', 'Sub Category', 'Warehouse', 'Shelf', 'Column', 'Stock', 'Min Threshold', 'Status', 'Description', 'Barcode'];
    const csvContent = [
      headers.join(','),
      ...inventory.map(item => [
        `"${item.name}"`,
        `"${item.category_name || ''}"`,
        `"${item.sub_category_name || ''}"`,
        `"${item.location}"`,
        `"${item.shelf || ''}"`,
        `"${item.shelf_column || ''}"`,
        item.current_stock,
        item.min_threshold,
        item.status,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.barcode
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
      data.append('locationDetails', formData.locationDetails);
      if (formData.additionalLocations.length > 0) {
        // Clean up columnBuilder before sending
        const cleanLocations = formData.additionalLocations.map(({ columnBuilder, ...rest }) => rest);
        data.append('additionalLocations', JSON.stringify(cleanLocations));
      }
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
          @media print { @page { margin: 0.5in; } }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .item-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .item-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .detail-row { padding: 10px; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
          .detail-value { font-size: 16px; margin-top: 5px; }
          .codes { display: flex; justify-content: space-around; align-items: center; margin-top: 30px; padding: 20px; background: #f9f9f9; border: 1px solid #ddd; }
          .code-item { text-align: center; }
          .code-item img { max-width: 200px; height: auto; }
          .code-label { font-weight: bold; margin-top: 10px; font-size: 14px; }
          .no-print { margin-top: 20px; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventory Item Details</h1>
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <div class="detail-row">
            <div class="detail-label">Category</div>
            <div class="detail-value">${item.category_name || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location</div>
            <div class="detail-value">${item.location} ${item.shelf ? `- ${item.shelf}` : ''}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Current Stock</div>
            <div class="detail-value">${item.current_stock}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Status</div>
            <div class="detail-value">${item.status}</div>
          </div>
          <div class="detail-row" style="grid-column: span 2;">
            <div class="detail-label">Description</div>
            <div class="detail-value">${item.description || 'No description'}</div>
          </div>
        </div>
        <div class="codes">
          <div class="code-item">
            <img src="${item.barcode_image_url}" alt="Barcode" />
            <div class="code-label">${item.barcode}</div>
          </div>
          ${item.qr_image_url ? `
          <div class="code-item">
            <img src="${item.qr_image_url}" alt="QR Code" />
            <div class="code-label">QR Code</div>
          </div>
          ` : ''}
        </div>
        <div class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Print Page</button>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <i className="fas fa-file-csv mr-2"></i> Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search inventory..."
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            <option value="Small">Small Warehouse</option>
            <option value="Large">Large Warehouse</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Row"
              className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={shelfFilter}
              onChange={(e) => setShelfFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Col"
              className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={columnFilter}
              onChange={(e) => setColumnFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <button onClick={() => printItem(item)} className="text-gray-600 hover:text-gray-900" title="Print">
                          <i className="fas fa-print"></i>
                        </button>
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {inventory.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                getStatusBadge={getStatusBadge}
                openGallery={openGallery}
                printItem={printItem}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {
        showModal && (
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
                    <input
                      type="text"
                      name="shelf"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                      value={formData.shelf}
                      onChange={handleInputChange}
                      placeholder="e.g. A1"
                      disabled={!formData.location}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Column</label>
                    {mainColumnBuilder.map((col, index) => (
                      <div key={col.id} className="flex items-center gap-2 mt-1">
                        {index > 0 && (
                          <select
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm w-20"
                            value={col.relation}
                            onChange={(e) => updateMainColumnBuilder(index, 'relation', e.target.value)}
                          >
                            <option value="To">To</option>
                            <option value="And">And</option>
                          </select>
                        )}
                        <input
                          type="text"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                          value={col.value}
                          onChange={(e) => updateMainColumnBuilder(index, 'value', e.target.value)}
                          placeholder={index === 0 ? "e.g. 1" : "e.g. 5"}
                          disabled={!formData.shelf}
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeMainColumn(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMainColumn}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      disabled={!formData.shelf}
                    >
                      + Add Col
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Details</label>
                  <input
                    type="text"
                    name="locationDetails"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={formData.locationDetails}
                    onChange={handleInputChange}
                    placeholder="e.g. Near the entrance, Top shelf"
                  />
                </div>

                {/* Additional Locations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Locations</label>
                    <button
                      type="button"
                      onClick={addLocation}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Location
                    </button>
                  </div>
                  {formData.additionalLocations.map((loc, index) => {
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded border">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Warehouse</label>
                          <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                            value={loc.warehouse}
                            onChange={(e) => handleLocationChange(index, 'warehouse', e.target.value)}
                          >
                            <option value="">Select Warehouse</option>
                            <option value="Small">Small Warehouse</option>
                            <option value="Large">Large Warehouse</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Row (Shelf)</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                            value={loc.shelf}
                            onChange={(e) => handleLocationChange(index, 'shelf', e.target.value)}
                            placeholder="e.g. A1"
                            disabled={!loc.warehouse}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Column</label>
                          {(loc.columnBuilder || [{ id: 'init', value: '', relation: 'To' }]).map((col, colIndex) => (
                            <div key={col.id} className="flex items-center gap-2 mt-1">
                              {colIndex > 0 && (
                                <select
                                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm w-20"
                                  value={col.relation}
                                  onChange={(e) => updateAddLocationColumnBuilder(index, colIndex, 'relation', e.target.value)}
                                >
                                  <option value="To">To</option>
                                  <option value="And">And</option>
                                </select>
                              )}
                              <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                value={col.value}
                                onChange={(e) => updateAddLocationColumnBuilder(index, colIndex, 'value', e.target.value)}
                                placeholder={colIndex === 0 ? "e.g. 1" : "e.g. 5"}
                                disabled={!loc.shelf}
                              />
                              {colIndex > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeAddLocationColumn(index, colIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addAddLocationColumn(index)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            disabled={!loc.shelf}
                          >
                            + Add Col
                          </button>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-red-600 hover:text-red-800 text-sm mb-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
        )
      }

      {
        showGallery && galleryItem && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                <h3 className="text-xl font-semibold text-gray-900">{galleryItem.name}</h3>
                <button onClick={() => setShowGallery(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-6">
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

                {(() => {
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
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                              title="Delete Image"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <i className="fas fa-image text-4xl mb-2"></i>
                      <p>No images available</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

const InventoryCard = ({ item, getStatusBadge, openGallery, printItem, handleEdit, handleDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const images = item.image_urls || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="border-b border-gray-200 last:border-0">
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-white active:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-900">{item.name}</h4>
            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
              {item.status}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {item.location} {item.shelf && `- ${item.shelf}`}
          </div>
        </div>
        <div className="ml-3">
          <i className={`fas fa-chevron-down transform transition-transform text-gray-400 ${expanded ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3 animation-fade-in">
          {/* Images Check */}
          <div className="flex justify-center mb-4">
            {item.image_url || images.length > 0 ? (
              <div
                className="relative cursor-pointer"
                onClick={() => openGallery(item)}
              >
                <img
                  src={images[0] || item.image_url}
                  alt={item.name}
                  className="h-32 w-32 object-cover rounded-lg shadow-sm"
                />
                {hasMultipleImages && (
                  <span className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                    +{images.length - 1}
                  </span>
                )}
              </div>
            ) : (
              <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                <i className="fas fa-image fa-2x"></i>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 text-xs uppercase">Category</span>
              <span className="font-medium">{item.category_name}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase">Stock</span>
              <span className="font-medium">{item.current_stock}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs uppercase">Barcode</span>
              {item.barcode_image_url ? (
                <div className="mt-1">
                  <img
                    src={item.barcode_image_url}
                    alt="Barcode"
                    className="h-10 w-auto cursor-pointer"
                    onClick={() => window.open(item.barcode_image_url, '_blank')}
                  />
                  <span className="text-xs text-gray-400 block mt-1">{item.barcode}</span>
                </div>
              ) : (
                <span className="font-medium">{item.barcode}</span>
              )}
            </div>
          </div>

          {item.description && (
            <div>
              <span className="block text-gray-500 text-xs uppercase mb-1">Description</span>
              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">{item.description}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 mt-2">
            <button onClick={() => printItem(item)} className="p-2 text-gray-600 hover:text-gray-900 bg-white rounded border border-gray-300 shadow-sm" title="Print">
              <i className="fas fa-print"></i>
            </button>
            <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-900 bg-white rounded border border-gray-300 shadow-sm" title="Edit">
              <i className="fas fa-edit"></i>
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:text-red-900 bg-white rounded border border-gray-300 shadow-sm" title="Delete">
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
