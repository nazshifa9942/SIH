import api from './client';

export const compareContracts = async (data) => {
    const response = await api.post('/contracts/compare', data);
    return response.data.data;
};

export const getContractByCargoRequestId = async (cargoRequestId) => {
    const response = await api.get(`/contracts/${cargoRequestId}`);
    return response.data.data;
};
