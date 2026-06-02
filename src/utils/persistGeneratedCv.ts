import { GenerateCVResponse } from '../services/api/aiService';
import { resumeService } from '../services/api/resumeService';
import { skillService } from '../services/api/skillService';

function parseSkillNames(skillsSection: string): string[] {
  if (!skillsSection?.trim()) return [];
  return skillsSection
    .split(/[;\n]/)
    .flatMap((group) => {
      const cleaned = group.replace(/^[^:]+:\s*/, '');
      return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
    })
    .slice(0, 24);
}

export async function persistGeneratedCvToResume(
  profileId: number,
  resumeName: string,
  data: GenerateCVResponse,
  templateKey?: string
): Promise<number> {
  const created = await resumeService.initResume(profileId, {
    resumeName,
    templateKey: templateKey ?? data.suggestedTemplateKey ?? undefined,
  });
  const resumeId = Number(created?.resumeId ?? created?.id);
  if (!resumeId) throw new Error('Không tạo được hồ sơ');

  if (data.summary?.trim()) {
    await resumeService.updateResume(resumeId, { summary: data.summary.trim() });
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const edu of data.educations ?? []) {
    const title = [edu.school, edu.major].filter(Boolean).join(' — ') || edu.school || 'Học vấn';
    const description = [edu.degree, edu.duration].filter(Boolean).join(' · ');
    await resumeService.addEducation(resumeId, {
      title,
      educationLevel: 'BACHELOR',
      startDate: today,
      endDate: null,
      description: description || null,
    });
  }

  for (const exp of data.experiences ?? []) {
    const title = [exp.title, exp.company].filter(Boolean).join(' @ ') || exp.company || 'Kinh nghiệm';
    const description = [(exp.bullets ?? []).join('\n'), exp.duration].filter(Boolean).join('\n\n');
    await resumeService.addWorkExperience(resumeId, {
      title,
      level: 'MIDDLE',
      startDate: today,
      endDate: null,
      description: description || null,
    });
  }

  for (const proj of data.projects ?? []) {
    const description = [proj.description, proj.duration].filter(Boolean).join('\n');
    await resumeService.addProject(resumeId, {
      title: proj.name || 'Dự án',
      startDate: today,
      endDate: null,
      description: description || null,
    });
  }

  for (const cert of data.certifications ?? []) {
    if (!cert?.trim()) continue;
    await resumeService.addCertificate(resumeId, {
      title: cert.trim(),
      issueDate: today,
      description: null,
    });
  }

  const skillNames = parseSkillNames(data.skillsSection);
  if (skillNames.length > 0) {
    const allSkills = await skillService.getAllSkills().catch(() => []);
    for (const name of skillNames) {
      const match = allSkills.find(
        (s) => s.skillName.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        try {
          await resumeService.addSkill(resumeId, { skillId: match.skillId, level: 'INTERMEDIATE' });
        } catch {
          // skill may already exist on resume
        }
      }
    }
  }

  return resumeId;
}
