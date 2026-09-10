import api from './client';

export const getPorts = async (params) => {
  const response = await api.get('/ports', { params });
  return response.data.data;
};

export const getPortById = async (id) => {
  const response = await api.get(`/ports/${id}`);
  return response.data.data;
};

export const createPort = async (portData) => {
  const response = await api.post('/ports', portData);
  return response.data.data;
};

export const updatePort = async (id, portData) => {
  const response = await api.put(`/ports/${id}`, portData);
  return response.data.data;
};
