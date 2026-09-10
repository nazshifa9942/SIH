import api from './client';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
