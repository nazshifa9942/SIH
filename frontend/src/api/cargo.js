import api from './client';

export const getCargoList = async () => {
  const response = await api.get('/cargo');
  return response.data.data;
};

export const getCargo = async (id) => {
  const response = await api.get(`/cargo/${id}`);
  return response.data.data;
};

export const createCargo = async (cargoData) => {
  const response = await api.post('/cargo', cargoData);
  return response.data.data;
};

export const updateCargo = async (id, cargoData) => {
  const response = await api.put(`/cargo/${id}`, cargoData);
  return response.data.data;
};
export const deleteCargo = async (id) => {
  const response = await api.delete(`/cargo/${id}`);
  return response.data.data;
};
