import { apiClient } from './client';
import { BaseResponse, Job } from './models';
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, HAS_ALGOLIA } from '../../config/env';

export interface JobSearchParams {
  keyword?: string;
  location?: string;
  jobType?: string;
  categoryName?: string;
}

function mapAlgoliaHit(hit: Record<string, unknown>): Job {
  return {
    jobId: Number(hit.jobId ?? hit.objectID ?? 0),
    title: String(hit.title ?? ''),
    companyId: hit.companyId != null ? Number(hit.companyId) : undefined,
    companyName: String(hit.companyName ?? ''),
    companyLogo: hit.companyLogo as string | undefined,
    thumbnailUrl: hit.thumbnailUrl as string | undefined,
    location: String(hit.location ?? ''),
    salaryMin: hit.salaryMin as number | undefined,
    salaryMax: hit.salaryMax as number | undefined,
    salaryCurrency: hit.salaryCurrency as string | undefined,
    hotTag: hit.hotTag as string | undefined,
    isExpired: Boolean(hit.isExpired),
    postedAt: String(hit.postedAt ?? ''),
    jobType: hit.jobType as string | undefined,
    yearsOfExperience: hit.yearsOfExperience as string | undefined,
  };
}

async function searchAlgolia(params: JobSearchParams): Promise<Job[] | null> {
  if (!HAS_ALGOLIA) return null;

  const keyword = params.keyword?.trim() ?? '';
  const location = params.location?.trim() ?? '';
  const categoryName = params.categoryName?.trim() ?? '';
  const searchQuery = [keyword, categoryName, location].filter(Boolean).join(' ').trim();

  let filters = '';
  if (params.jobType?.trim()) {
    const jobType = params.jobType.trim().toUpperCase().replace(/-/g, '_');
    filters = `jobType:${jobType}`;
  }

  const algoliaParams = [
    searchQuery ? `query=${encodeURIComponent(searchQuery)}` : 'query=',
    filters ? `filters=${encodeURIComponent(filters)}` : '',
    'page=0',
    'hitsPerPage=30',
  ]
    .filter(Boolean)
    .join('&');

  try {
    const response = await fetch(
      `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/jobs_now_index/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ params: algoliaParams }),
      }
    );
    if (!response.ok) return null;
    const result = await response.json();
    if (result.hits && Array.isArray(result.hits)) {
      return result.hits.map((hit: Record<string, unknown>) => mapAlgoliaHit(hit));
    }
  } catch (e) {
    console.warn('Algolia search failed, falling back to backend search', e);
  }
  return null;
}

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

  searchJobs: async (params: JobSearchParams | string): Promise<Job[]> => {
    const searchParams: JobSearchParams =
      typeof params === 'string' ? { keyword: params } : params;

    const algoliaResults = await searchAlgolia(searchParams);
    if (algoliaResults) return algoliaResults;

    const combinedKeyword = [searchParams.keyword, searchParams.categoryName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const query = new URLSearchParams();
    if (combinedKeyword) query.set('keyword', combinedKeyword);
    if (searchParams.location?.trim()) query.set('location', searchParams.location.trim());
    if (searchParams.jobType?.trim()) {
      query.set('jobType', searchParams.jobType.trim().toUpperCase().replace(/-/g, '_'));
    }

    const qs = query.toString();
    const response = await apiClient.get<any, BaseResponse<Job[]>>(
      `/job/searchJobs${qs ? `?${qs}` : ''}`
    );
    return response.data ?? [];
  },
};
