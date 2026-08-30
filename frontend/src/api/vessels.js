import api from './client';

export const getVessels = async (params) => {
    const response = await api.get('/vessels', { params });
    return response.data.data;
};

export const getVesselById = async (id) => {
    const response = await api.get(`/vessels/${id}`);
    return response.data.data;
};

export const createVessel = async (data) => {
    const response = await api.post('/vessels', data);
    return response.data.data;
};

export const updateVessel = async (id, data) => {
    const response = await api.put(`/vessels/${id}`, data);
    return response.data.data;
};

export const getVesselAvailability = async (id, params) => {
    const response = await api.get(`/vessels/${id}/availability`, { params });
    return response.data.data;
};
