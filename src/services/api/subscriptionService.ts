import { apiClient } from './client';
import { BaseResponse } from './models';

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
    const response = await apiClient.get<any, BaseResponse<SubscriptionPlan[]>>('/plans', {
      params: { scope: 'CANDIDATE_SUBSCRIPTION' },
    });
    return response.data ?? [];
  },

  getCandidateSubscriptionStatus: async (): Promise<CandidateSubscriptionStatus> => {
    const response = await apiClient.get<any, BaseResponse<CandidateSubscriptionStatus>>(
      '/payment/candidate/subscription-status'
    );
    return response.data;
  },

  createPaymentUrl: async (planId: number): Promise<string> => {
    const response = await apiClient.post<any, BaseResponse<{ paymentUrl: string }>>('/payment/create', { planId });
    return response.data?.paymentUrl ?? '';
  },
};
