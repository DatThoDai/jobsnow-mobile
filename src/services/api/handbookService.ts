import { apiClient } from './client';
import { BaseResponse, HandbookPost, HandbookDetail } from './models';

export const handbookService = {
  getFeatured: async (limit: number = 12): Promise<HandbookPost[]> => {
    const response = await apiClient.get<any, BaseResponse<HandbookPost[]>>(`/handbook/featured?limit=${limit}`);
    return response.data;
  },

  getExplore: async (limit: number = 9): Promise<HandbookPost[]> => {
    const response = await apiClient.get<any, BaseResponse<HandbookPost[]>>(`/handbook/explore?limit=${limit}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<HandbookDetail> => {
    const response = await apiClient.get<any, BaseResponse<HandbookDetail>>(`/handbook/${slug}`);
    return response.data;
  },
};
