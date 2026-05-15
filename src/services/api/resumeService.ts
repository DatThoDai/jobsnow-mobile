import { apiClient } from './client';
import { BaseResponse, Resume } from './models';

export const resumeService = {
  getResumesByProfile: async (profileId: number): Promise<Resume[]> => {
    const response = await apiClient.get<any, BaseResponse<Resume[]>>(`/resume/profile/${profileId}`);
    return response.data;
  },

  initResume: async (profileId: number, data: { title: string }): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/init/${profileId}`, data);
    return response.data;
  },

  deleteResume: async (resumeId: number): Promise<void> => {
    await apiClient.delete(`/resume/delete/${resumeId}`);
  },

  updateResume: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.put<any, BaseResponse<any>>(`/resume/${resumeId}`, data);
    return response.data;
  },

  setPrimary: async (resumeId: number, profileId: number): Promise<void> => {
    await apiClient.put(`/resume/${resumeId}/set-primary?profileId=${profileId}`);
  },

  getEducations: async (resumeId: number): Promise<any[]> => {
    const response = await apiClient.get<any, BaseResponse<any[]>>(`/resume/${resumeId}/educations`);
    return response.data;
  },

  addEducation: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/${resumeId}/educations`, data);
    return response.data;
  },

  deleteEducation: async (resumeId: number, id: number): Promise<void> => {
    await apiClient.delete(`/resume/${resumeId}/educations/${id}`);
  },

  getWorkExperiences: async (resumeId: number): Promise<any[]> => {
    const response = await apiClient.get<any, BaseResponse<any[]>>(`/resume/${resumeId}/work-experiences`);
    return response.data;
  },

  addWorkExperience: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/${resumeId}/work-experiences`, data);
    return response.data;
  },

  deleteWorkExperience: async (resumeId: number, id: number): Promise<void> => {
    await apiClient.delete(`/resume/${resumeId}/work-experiences/${id}`);
  },

  getProjects: async (resumeId: number): Promise<any[]> => {
    const response = await apiClient.get<any, BaseResponse<any[]>>(`/resume/${resumeId}/projects`);
    return response.data;
  },

  addProject: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/${resumeId}/projects`, data);
    return response.data;
  },

  deleteProject: async (resumeId: number, id: number): Promise<void> => {
    await apiClient.delete(`/resume/${resumeId}/projects/${id}`);
  },

  getCertificates: async (resumeId: number): Promise<any[]> => {
    const response = await apiClient.get<any, BaseResponse<any[]>>(`/resume/${resumeId}/certificates`);
    return response.data;
  },

  addCertificate: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/${resumeId}/certificates`, data);
    return response.data;
  },

  deleteCertificate: async (resumeId: number, id: number): Promise<void> => {
    await apiClient.delete(`/resume/${resumeId}/certificates/${id}`);
  },

  getSkills: async (resumeId: number): Promise<any[]> => {
    const response = await apiClient.get<any, BaseResponse<any[]>>(`/resume/${resumeId}/skills`);
    return response.data;
  },

  addSkill: async (resumeId: number, data: any): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>(`/resume/${resumeId}/skills`, data);
    return response.data;
  },

  removeSkill: async (resumeId: number, skillId: number): Promise<void> => {
    await apiClient.delete(`/resume/${resumeId}/skills/${skillId}`);
  },
};
