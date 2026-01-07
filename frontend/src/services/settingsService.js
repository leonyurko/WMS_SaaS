import api from './api';

export const fetchSettings = async () => {
    const response = await api.get('/settings');
    return response.data.settings;
};

export const updateSettings = async (settings) => {
    const response = await api.put('/settings', { settings });
    return response.data;
};
