import api from './api';

/**
 * Get all wear reports
 */
export const fetchWearReports = async (params = {}) => {
    const response = await api.get('/wear-equipment', { params });
    return response.data.reports;
};

/**
 * Get wear report by ID
 */
export const fetchWearReportById = async (id) => {
    const response = await api.get(`/wear-equipment/${id}`);
    return response.data.report;
};

/**
 * Get wear equipment stats
 */
export const fetchWearStats = async () => {
    const response = await api.get('/wear-equipment/stats');
    return response.data.stats;
};

/**
 * Create wear report
 */
export const createWearReport = async (data) => {
    const formData = new FormData();
    formData.append('inventoryId', data.inventoryId);
    formData.append('severity', data.severity);
    if (data.description) {
        formData.append('description', data.description);
    }
    if (data.media && data.media.length > 0) {
        data.media.forEach(file => {
            formData.append('media', file);
        });
    }

    const response = await api.post('/wear-equipment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Update wear report
 */
export const updateWearReport = async (id, data) => {
    const response = await api.put(`/wear-equipment/${id}`, data);
    return response.data;
};

/**
 * Resolve wear report
 */
export const resolveWearReport = async (id) => {
    const response = await api.post(`/wear-equipment/${id}/resolve`);
    return response.data;
};

/**
 * Archive wear report
 */
export const archiveWearReport = async (id) => {
    const response = await api.post(`/wear-equipment/${id}/archive`);
    return response.data;
};

/**
 * Upload media to wear report
 */
export const uploadWearMedia = async (id, file) => {
    const formData = new FormData();
    formData.append('media', file);

    const response = await api.post(`/wear-equipment/${id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

/**
 * Remove media from wear report
 */
export const removeWearMedia = async (id, mediaUrl) => {
    const response = await api.delete(`/wear-equipment/${id}/media`, {
        data: { mediaUrl }
    });
    return response.data;
};

/**
 * Delete wear report
 */
export const deleteWearReport = async (id) => {
    const response = await api.delete(`/wear-equipment/${id}`);
    return response.data;
};
