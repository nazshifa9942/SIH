import api from './client';

export const analyzeRisk = async (data) => {
    const response = await api.post('/risk/analyze', data);
    return response.data.data;
};

export const getRiskByCargoRequestId = async (cargoRequestId) => {
    const response = await api.get(`/risk/${cargoRequestId}`);
    return response.data.data;
};
