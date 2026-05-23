import { apiClient } from './client';
import { BaseResponse } from './models';

export interface Skill {
  skillId: number;
  skillName: string;
}

export const skillService = {
  getAllSkills: async (): Promise<Skill[]> => {
    const response = await apiClient.get<any, BaseResponse<Skill[]>>('/skill/all');
    const list = response.data ?? [];
    return list
      .map((dto: { skillId?: number; skillName?: string; name?: string }) => ({
        skillId: Number(dto.skillId ?? 0),
        skillName: dto.skillName ?? dto.name ?? '',
      }))
      .filter((s) => s.skillId && s.skillName)
      .sort((a, b) => a.skillName.localeCompare(b.skillName));
  },
};
