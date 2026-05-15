import { apiClient } from './client';
import { BaseResponse, Company, CompanyReview, Job } from './models';

export const companyService = {
  getCompanyById: async (companyId: number): Promise<Company> => {
    const response = await apiClient.get<any, BaseResponse<Company>>(`/company/${companyId}`);
    return response.data;
  },

  getVipCompanies: async (minLevel: number = 2, limit: number = 8): Promise<Company[]> => {
    const response = await apiClient.get<any, BaseResponse<Company[]>>(`/company/vip?minLevel=${minLevel}&limit=${limit}`);
    return response.data;
  },

  getCompanyJobs: async (companyId: number): Promise<Job[]> => {
    const response = await apiClient.get<any, BaseResponse<Job[]>>(`/job/company/${companyId}`);
    return response.data;
  },

  followCompany: async (companyId: number): Promise<void> => {
    await apiClient.post(`/company/${companyId}/follow`);
  },

  unfollowCompany: async (companyId: number): Promise<void> => {
    await apiClient.delete(`/company/${companyId}/follow`);
  },

  isFollowing: async (companyId: number): Promise<boolean> => {
    const response = await apiClient.get<any, BaseResponse<boolean>>(`/company/${companyId}/follow`);
    return response.data;
  },

  getMyFollowedCompanies: async (page: number = 0, size: number = 20): Promise<any> => {
    const response = await apiClient.get<any, BaseResponse<any>>(`/company/my-followed?page=${page}&size=${size}`);
    return response.data;
  },

  getReviews: async (companyId: number, page: number = 1, limit: number = 5): Promise<any> => {
    const response = await apiClient.get<any, BaseResponse<any>>(`/company/${companyId}/reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  createReview: async (companyId: number, data: { rating: number; title: string; pros: string; cons: string; recommend: boolean }): Promise<void> => {
    await apiClient.post(`/company/${companyId}/reviews`, data);
  },
};
