import { apiClient } from './client';
import { BaseResponse, Job } from './models';

export const jobService = {
  getAllJobs: async (): Promise<Job[]> => {
    const response = await apiClient.get<any, BaseResponse<Job[]>>('/job');
    return response.data;
  },

  getHotJobs: async (limit: number = 10): Promise<Job[]> => {
    const response = await apiClient.get<any, BaseResponse<Job[]>>(`/job/hot?limit=${limit}`);
    return response.data;
  },

  getJobById: async (jobId: number): Promise<Job> => {
    const response = await apiClient.get<any, BaseResponse<Job>>(`/job/${jobId}`);
    return response.data;
  },

  searchJobs: async (keyword: string): Promise<Job[]> => {
    // Attempt Algolia Search First
    const appId = 'RX0BJKNL6W';
    const apiKey = '7e2f3f278f0a983ec17ee7b09ac668b0';
    try {
      if (keyword.trim().length > 0) {
        const response = await fetch(`https://${appId}-dsn.algolia.net/1/indexes/jobs_now_index/query`, {
          method: 'POST',
          headers: {
            'X-Algolia-API-Key': apiKey,
            'X-Algolia-Application-Id': appId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            params: `query=${encodeURIComponent(keyword)}&page=0&hitsPerPage=20`,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.hits && Array.isArray(result.hits)) {
            // Map Algolia Hits to Job array
            return result.hits.map((hit: any) => ({
              jobId: hit.jobId || hit.objectID,
              title: hit.title,
              companyId: hit.companyId,
              companyName: hit.companyName,
              companyLogo: hit.companyLogo,
              thumbnailUrl: hit.thumbnailUrl,
              location: hit.location,
              salaryMin: hit.salaryMin,
              salaryMax: hit.salaryMax,
              salaryCurrency: hit.salaryCurrency,
              hotTag: hit.hotTag,
              isExpired: hit.isExpired,
              postedAt: hit.postedAt,
              jobType: hit.jobType,
              yearsOfExperience: hit.yearsOfExperience,
            } as Job));
          }
        }
      }
    } catch (e) {
      console.warn('Algolia search failed, falling back to backend search', e);
    }

    // Fallback to Backend Search
    const response = await apiClient.get<any, BaseResponse<Job[]>>(`/job/searchJobs?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  },
};
