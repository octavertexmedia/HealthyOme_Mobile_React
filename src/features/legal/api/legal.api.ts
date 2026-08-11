import apiClient from '../../../shared/api/client';
import type { LegalPage } from '../types/legal.types';

export const legalApi = {
  // GET /legal-pages/ -> BARE array of { slug, title, body, last_updated }.
  getLegalPages: async (): Promise<LegalPage[]> => {
    const response = await apiClient.get<LegalPage[]>('/legal-pages/');
    return Array.isArray(response.data) ? response.data : [];
  },

  // GET /legal-pages/{slug}/ -> BARE object; 404 { error: 'Not found' }.
  getLegalPage: async (slug: string): Promise<LegalPage> => {
    const response = await apiClient.get<LegalPage>(`/legal-pages/${slug}/`);
    return response.data;
  },
};
