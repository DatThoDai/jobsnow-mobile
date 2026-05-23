import { create } from 'zustand';
import { Job } from '../services/api/models';
import { jobService } from '../services/api/jobService';

interface JobState {
  featuredJobs: Job[];
  latestJobs: Job[];
  isLoading: boolean;
  error: string | null;
  fetchHomeJobs: () => Promise<void>;
}

export const useJobStore = create<JobState>((set) => ({
  featuredJobs: [],
  latestJobs: [],
  isLoading: false,
  error: null,

  fetchHomeJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      // Run both fetch calls in parallel
      const [hotResponse, latestResponse] = await Promise.all([
        jobService.getHotJobs(5),
        jobService.getAllJobs(),
      ]);

      const slicedLatest = latestResponse.slice(0, 5);

      set({
        featuredJobs: hotResponse,
        latestJobs: slicedLatest,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch jobs', isLoading: false });
    }
  },
}));
