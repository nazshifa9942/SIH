import api from './client';

export const optimizeVesselPlan = async (data) => {
    const response = await api.post('/optimization/vessel-plan', data);
    return response.data.data;
};
