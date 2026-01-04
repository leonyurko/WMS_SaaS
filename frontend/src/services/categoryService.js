import api from './api';

const getAllCategories = async (hierarchical = false) => {
    return api.get('/categories', { params: { hierarchical } });
};

const createCategory = async (data) => {
    return api.post('/categories', data);
};

const updateCategory = async (id, data) => {
    return api.put(`/categories/${id}`, data);
};

const deleteCategory = async (id) => {
    return api.delete(`/categories/${id}`);
};

export default {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
