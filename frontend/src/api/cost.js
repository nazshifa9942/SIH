import api from './client';

export const estimateCost = async (data) => {
    const response = await api.post('/cost/estimate', data);
    return response.data.data;
};

export const getCostByCargoRequestId = async (cargoRequestId) => {
    const response = await api.get(`/cost/${cargoRequestId}`);
    return response.data.data;
};
