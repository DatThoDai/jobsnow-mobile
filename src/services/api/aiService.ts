import { apiClient } from './client';
import { unwrapApiData } from '../../utils/apiResponse';

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

export interface JobMatchResponse {
  overallScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  ruleBasedScore: number;
  aiSemanticScore: number;
  aiFeedback: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  jobTitle: string;
  companyName: string;
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

export interface GenerateCVExperience {
  company: string;
  title: string;
  duration: string;
  bullets: string[];
}

export interface GenerateCVEducation {
  school: string;
  degree: string;
  major: string;
  duration: string;
}

export interface GenerateCVProject {
  name: string;
  description: string;
  duration: string;
}

export interface GenerateCVResponse {
  summary: string;
  experiences: GenerateCVExperience[];
  educations: GenerateCVEducation[];
  skillsSection: string;
  certifications: string[];
  projects: GenerateCVProject[];
  suggestedTemplateKey?: string;
}

export const aiService = {
  improveCVFromText: async (request: ImproveCVRequest): Promise<ImproveCVResponse> => {
    const response = await apiClient.post('/api/ai/improve-cv', request);
    return unwrapApiData<ImproveCVResponse>(response);
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
    const response = await apiClient.post('/api/ai/improve-cv/upload', formData);
    return unwrapApiData<ImproveCVResponse>(response);
  },

  generateCV: async (request: GenerateCVRequest): Promise<GenerateCVResponse> => {
    const response = await apiClient.post('/api/ai/generate-cv', request);
    return unwrapApiData<GenerateCVResponse>(response);
  },

  calculateJobMatch: async (request: JobMatchRequest): Promise<JobMatchResponse> => {
    const response = await apiClient.post('/api/ai/job-match', request);
    const data = unwrapApiData<JobMatchResponse>(response);
    return {
      ...data,
      matchedSkills: data.matchedSkills ?? [],
      missingSkills: data.missingSkills ?? [],
      recommendations: data.recommendations ?? [],
      aiFeedback: data.aiFeedback ?? '',
    };
  },

  getMyMatches: async (profileId: number): Promise<JobMatchItem[]> => {
    const response = await apiClient.get(`/api/ai/job-match/my-matches/${profileId}`);
    return unwrapApiData<JobMatchItem[]>(response) ?? [];
  },

  recalculateForProfile: async (profileId: number): Promise<void> => {
    await apiClient.post(`/api/ai/job-match/recalculate/profile/${profileId}`);
  },
};
