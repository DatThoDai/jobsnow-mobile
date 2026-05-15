import { apiClient } from './client';
import { BaseResponse, JobSeekerProfile } from './models';

export const profileService = {
  getProfileByUserId: async (userId: number): Promise<JobSeekerProfile> => {
    const response = await apiClient.get<any, BaseResponse<JobSeekerProfile>>(`/profile/user/${userId}`);
    return response.data;
  },

  getProfileById: async (profileId: number): Promise<JobSeekerProfile> => {
    const response = await apiClient.get<any, BaseResponse<JobSeekerProfile>>(`/profile/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: number, data: Partial<JobSeekerProfile>): Promise<void> => {
    await apiClient.put(`/profile/${profileId}`, data);
  },
};
