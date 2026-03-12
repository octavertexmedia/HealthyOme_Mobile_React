import apiClient from '../../../shared/api/client';

export const bowlApi = {
  getBases: async () => {
    const response = await apiClient.get('/bowl-bases/');
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  getIngredients: async (type?: string) => {
    const params = type ? { ingredient_type: type } : {};
    const response = await apiClient.get('/bowl-ingredients/', { params });
    if (Array.isArray(response.data)) return response.data;
    return response.data.results || [];
  },

  createBowl: async (data: {
    base_id: number;
    ingredient_ids: number[];
    preparation: 'warm' | 'cold';
  }) => {
    const response = await apiClient.post('/bowls/create/', data);
    return response.data;
  },
};
