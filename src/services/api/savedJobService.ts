import { apiClient } from './client';
import { BaseResponse, SavedJob } from './models';

export const savedJobService = {
  getSavedJobs: async (profileId: number): Promise<SavedJob[]> => {
    const response = await apiClient.get<any, BaseResponse<SavedJob[]>>(`/savedJob/${profileId}`);
    return response.data;
  },

  saveJob: async (profileId: number, jobId: number): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/savedJob/${profileId}/job/${jobId}`);
    return response.data;
  },

  unsaveJob: async (profileId: number, jobId: number): Promise<void> => {
    await apiClient.delete(`/savedJob/${profileId}/job/${jobId}`);
  },

  isJobSaved: async (profileId: number, jobId: number): Promise<boolean> => {
    const response = await apiClient.get<any, BaseResponse<boolean>>(`/savedJob/${profileId}/job/${jobId}`);
    return response.data;
  },
};
