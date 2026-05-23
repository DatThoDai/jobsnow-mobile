import { apiClient } from './client';
import { BaseResponse, HandbookPost } from './models';

export interface HandbookPage {
  items: HandbookPost[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
}

export const handbookService = {
  getFeatured: async (limit: number = 12): Promise<HandbookPost[]> => {
    const response = await apiClient.get<any, BaseResponse<HandbookPost[]>>(
      `/handbook/featured?limit=${limit}`
    );
    return response.data;
  },

  getExplore: async (limit: number = 9): Promise<HandbookPost[]> => {
    const response = await apiClient.get<any, BaseResponse<HandbookPost[]>>(
      `/handbook/explore?limit=${limit}`
    );
    return response.data;
  },

  getList: async (page = 1, size = 20, categoryKey?: string): Promise<HandbookPage> => {
    const response = await apiClient.get<any, BaseResponse<HandbookPage>>('/handbook', {
      params: {
        page,
        size,
        ...(categoryKey ? { categoryKey } : {}),
      },
    });
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await apiClient.get(`/handbook/${encodeURIComponent(slug)}`);
    return (response as any).data ?? response;
  },
};
