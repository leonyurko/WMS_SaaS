import api from './api';

export const fetchInventory = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data.data;
};

export const fetchInventoryById = async (id) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data.data.item;
};

export const fetchInventoryByBarcode = async (barcode) => {
  const response = await api.get(`/inventory/barcode/${barcode}`);
  return response.data.data.item;
};

export const createInventory = async (formData) => {
  const response = await api.post('/inventory', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};

export const updateInventory = async (id, formData) => {
  const response = await api.put(`/inventory/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data.item;
};

export const deleteInventory = async (id) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};

export const updateStock = async (id, data) => {
  const response = await api.post(`/inventory/${id}/stock`, data);
  return response.data.data;
};
