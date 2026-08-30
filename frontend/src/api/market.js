import api from './client';

export const getFreightMarketData = async (params) => {
    const response = await api.get('/market/freight', { params });
    return response.data.data;
};

export const getFuelMarketData = async (params) => {
    const response = await api.get('/market/fuel', { params });
    return response.data.data;
};

export const getCommodityMarketData = async (params) => {
    const response = await api.get('/market/commodity', { params });
    return response.data.data;
};

export const getEconomicMarketData = async (params) => {
    const response = await api.get('/market/economic', { params });
    return response.data.data;
};
