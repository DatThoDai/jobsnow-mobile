import { apiClient } from './client';
import { unwrapApiData } from '../../utils/apiResponse';

export interface SubscriptionPlan {
  planId: number;
  name: string;
  price: number;
  type: string;
  durationDays: number;
  scope: string;
  description: string;
}

export interface CandidateSubscriptionStatus {
  accountStatus: string;
  currentPlanId: number | null;
  currentPlanName: string | null;
  active: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  remainingAiMatches: number;
  remainingAiCvBuilderTrials: number;
  isProfileHighlighted: boolean;
}

export const subscriptionService = {
  getCandidatePlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/plans', {
      params: { scope: 'CANDIDATE_SUBSCRIPTION' },
    });
    return unwrapApiData<SubscriptionPlan[]>(response) ?? [];
  },

  getCandidateSubscriptionStatus: async (): Promise<CandidateSubscriptionStatus> => {
    const response = await apiClient.get('/payment/candidate/subscription-status');
    return unwrapApiData<CandidateSubscriptionStatus>(response);
  },

  createPaymentUrl: async (planId: number): Promise<string> => {
    const response = await apiClient.post('/payment/create', { planId });
    const data = unwrapApiData<{ paymentUrl: string }>(response);
    return data?.paymentUrl ?? '';
  },
};
