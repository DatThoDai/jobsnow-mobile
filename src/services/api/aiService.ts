import { apiClient } from './client';
import { BaseResponse } from './models';

export interface ImproveCVRequest {
  cvText?: string;
  resumeId?: number;
  language?: 'auto' | 'vi' | 'en';
}

export interface SectionFeedback {
  section: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ImproveCVResponse {
  overallScore: number;
  overviewFeedback: string;
  sections: SectionFeedback[];
  missingKeywords: string[];
  extractedSkills: string[];
  improvedSummary: string;
  actionItems: string[];
}

export interface JobMatchRequest {
  jobId: number;
  profileId?: number;
  resumeId?: number;
}

export interface JobMatchItem {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  overallScore: number;
}

export interface GenerateCVRequest {
  profileId?: number;
  fullName?: string;
  title?: string;
  targetJob?: string;
  industry?: string;
  additionalInfo?: string;
  skills?: string[];
  language?: string;
}

export const aiService = {
  improveCVFromText: async (request: ImproveCVRequest): Promise<ImproveCVResponse> => {
    const response = await apiClient.post<any, BaseResponse<ImproveCVResponse>>(
      '/api/ai/improve-cv',
      request
    );
    return response.data;
  },

  improveCVFromFile: async (
    file: { uri: string; name: string; mimeType?: string },
    language: 'auto' | 'vi' | 'en' = 'auto'
  ): Promise<ImproveCVResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/pdf',
    } as unknown as Blob);
    formData.append('language', language);
    const response = await apiClient.post<any, BaseResponse<ImproveCVResponse>>(
      '/api/ai/improve-cv/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  generateCV: async (request: GenerateCVRequest): Promise<unknown> => {
    const response = await apiClient.post<any, BaseResponse<unknown>>('/api/ai/generate-cv', request);
    return response.data;
  },

  calculateJobMatch: async (request: JobMatchRequest): Promise<unknown> => {
    const response = await apiClient.post<any, BaseResponse<unknown>>('/api/ai/job-match', request);
    return response.data;
  },

  getMyMatches: async (profileId: number): Promise<JobMatchItem[]> => {
    const response = await apiClient.get<any, BaseResponse<JobMatchItem[]>>(
      `/api/ai/job-match/my-matches/${profileId}`
    );
    return response.data ?? [];
  },

  recalculateForProfile: async (profileId: number): Promise<void> => {
    await apiClient.post(`/api/ai/job-match/recalculate/profile/${profileId}`);
  },
};
