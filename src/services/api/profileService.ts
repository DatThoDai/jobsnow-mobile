import { apiClient } from './client';
import { BaseResponse, JobSeekerProfile } from './models';

export interface ProfileSkill {
  skillId: number;
  skillName?: string;
  level?: string;
  yearsOfExperience?: number | null;
}

export interface SocialLinkPayload {
  platform: string;
  url: string;
  logo_url?: string;
}

export const profileService = {
  getProfileByUserId: async (userId: number): Promise<JobSeekerProfile> => {
    const response = await apiClient.get<any, BaseResponse<JobSeekerProfile>>(`/profile/user/${userId}`);
    return response.data;
  },

  getProfileById: async (profileId: number): Promise<JobSeekerProfile> => {
    const response = await apiClient.get<any, BaseResponse<JobSeekerProfile>>(`/profile/${profileId}`);
    return response.data;
  },

  updateProfile: async (
    profileId: number,
    data: Partial<JobSeekerProfile> & {
      title?: string;
      headline?: string;
      socials?: SocialLinkPayload[];
    }
  ): Promise<void> => {
    const payload: Record<string, unknown> = {
      fullName: data.fullName,
      phone: data.phone,
      bio: data.bio,
      address: data.address,
      title: data.title ?? data.headline,
    };
    if (data.socials !== undefined) {
      payload.socials = data.socials;
    }
    await apiClient.put(`/profile/${profileId}`, payload);
  },

  addProfileSkill: async (
    profileId: number,
    currentSkills: ProfileSkill[],
    skillId: number,
    level: string = 'Intermediate'
  ): Promise<void> => {
    await apiClient.put('/profile/skills', {
      profileId,
      skills: [
        ...currentSkills.map((s) => ({
          skillId: s.skillId,
          level: s.level ?? 'Intermediate',
          yearsOfExperience: s.yearsOfExperience ?? null,
        })),
        { skillId, level, yearsOfExperience: null },
      ],
    });
  },

  removeProfileSkill: async (profileId: number, currentSkills: ProfileSkill[], skillId: number): Promise<void> => {
    const next = currentSkills.filter((s) => s.skillId !== skillId);
    await apiClient.put('/profile/skills', {
      profileId,
      skills: next.map((s) => ({
        skillId: s.skillId,
        level: s.level ?? 'Intermediate',
        yearsOfExperience: s.yearsOfExperience ?? null,
      })),
    });
  },
};
