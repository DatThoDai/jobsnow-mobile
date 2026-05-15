import { apiClient } from './client';
import { BaseResponse, JobCategory } from './models';

export const categoryService = {
  getAllCategories: async (): Promise<JobCategory[]> => {
    const response = await apiClient.get<any, BaseResponse<JobCategory[]>>('/category/all');
    return response.data;
  },
};
