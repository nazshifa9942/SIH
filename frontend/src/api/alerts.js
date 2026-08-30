import api from './client';

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data.data;
};
