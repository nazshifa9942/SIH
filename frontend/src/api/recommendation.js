import api from './client';

export const getRecommendations = async (data) => {
  const response = await api.post('/recommendations', data);
  return response.data.data;
};

export const getRecommendationById = async (id) => {
  const response = await api.get(`/recommendations/${id}`);
  return response.data.data;
};

export const getRecommendationHistory = async (cargoRequestId) => {
  const response = await api.get(`/recommendations/cargo/${cargoRequestId}`);
  return response.data.data;
};