import api from './client';

export const forecastFreight = async (data) => {
    const response = await api.post('/forecast/freight', data);
    return response.data.data;
};

export const getForecastByCargoRequestId = async (cargoRequestId) => {
    const response = await api.get(`/forecast/${cargoRequestId}`);
    return response.data.data;
};
