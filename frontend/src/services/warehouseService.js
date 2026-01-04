import api from './api';

// Get all warehouses
export const getAllWarehouses = async () => {
    try {
        const response = await api.get('/warehouses');
        return response.data.data.warehouses;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch warehouses';
    }
};

// Create warehouse (Admin only)
export const createWarehouse = async (name) => {
    try {
        const response = await api.post('/warehouses', { name });
        return response.data.data.warehouse;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to create warehouse';
    }
};

// Update warehouse (Admin only)
export const updateWarehouse = async (id, name) => {
    try {
        const response = await api.put(`/warehouses/${id}`, { name });
        return response.data.data.warehouse;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update warehouse';
    }
};

// Delete warehouse (Admin only)
export const deleteWarehouse = async (id) => {
    try {
        await api.delete(`/warehouses/${id}`);
        return true;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to delete warehouse';
    }
};
