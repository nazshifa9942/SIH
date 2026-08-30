import api from './client';

export const getPorts = async (params) => {
    const response = await api.get('/ports', { params });
    return response.data.data;
};
