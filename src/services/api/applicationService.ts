import { apiClient } from './client';
import { Application, BaseResponse } from './models';

export const applicationService = {
  applyForJob: async (jobId: number, profileId: number, resumeId: number): Promise<void> => {
    await apiClient.post('/application/apply', { jobId, profileId, resumeId });
  },

  getApplicationsByJobSeeker: async (profileId: number): Promise<Application[]> => {
    const response = await apiClient.get<any, BaseResponse<Application[]>>(`/application/jobseeker/${profileId}`);
    return response.data;
  },

  getApplicationDetail: async (applicationId: number): Promise<any> => {
    const response = await apiClient.get<any, BaseResponse<any>>(`/application/${applicationId}`);
    return response.data;
  },
};
