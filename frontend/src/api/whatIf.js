import api from './client';

export const createWhatIfScenario = async (data) => {
  const response = await api.post('/what-if/scenarios', data);
  return response.data.data;
};

export const getWhatIfScenarios = async (cargoRequestId) => {
  const response = await api.get(`/what-if/scenarios/cargo/${cargoRequestId}`);
  return response.data.data;
};

export const updateWhatIfScenario = async (id, data) => {
  const response = await api.put(`/what-if/scenarios/${id}`, data);
  return response.data.data;
};

export const deleteWhatIfScenario = async (id) => {
  const response = await api.delete(`/what-if/scenarios/${id}`);
  return response.data.data;
};

export const runWhatIfScenario = async (id) => {
  const response = await api.post(`/what-if/scenarios/${id}/run`);
  return response.data.data;
};
