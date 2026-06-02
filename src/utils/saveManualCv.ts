import { ManualCvDraft } from '../types/manualCvDraft';
import { resumeService } from '../services/api/resumeService';
import { normalizeDateInput } from '../constants/resumeEnums';

export async function saveManualCvDraft(profileId: number, draft: ManualCvDraft): Promise<number> {
  const resumeName = draft.resumeName.trim();
  if (!resumeName) throw new Error('Vui lòng nhập tên CV');

  const created = await resumeService.initResume(profileId, { resumeName });
  const resumeId = Number(created?.resumeId ?? created?.id);
  if (!resumeId) throw new Error('Không tạo được hồ sơ');

  if (draft.summary.trim()) {
    await resumeService.updateResume(resumeId, { summary: draft.summary.trim() });
  }

  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < draft.experiences.length; i++) {
    const we = draft.experiences[i];
    if (!we.title.trim()) continue;
    await resumeService.addWorkExperience(resumeId, {
      title: we.title.trim(),
      level: we.level || 'FRESHER',
      startDate: normalizeDateInput(we.startDate) || today,
      endDate: normalizeDateInput(we.endDate),
      description: we.description?.trim() || null,
    });
  }

  for (let i = 0; i < draft.educations.length; i++) {
    const edu = draft.educations[i];
    if (!edu.title.trim()) continue;
    await resumeService.addEducation(resumeId, {
      title: edu.title.trim(),
      educationLevel: edu.educationLevel || 'BACHELOR',
      startDate: normalizeDateInput(edu.startDate) || today,
      endDate: normalizeDateInput(edu.endDate),
      description: edu.description?.trim() || null,
    });
  }

  for (let i = 0; i < draft.projects.length; i++) {
    const proj = draft.projects[i];
    if (!proj.title.trim()) continue;
    await resumeService.addProject(resumeId, {
      title: proj.title.trim(),
      startDate: normalizeDateInput(proj.startDate) || today,
      endDate: normalizeDateInput(proj.endDate),
      description: proj.description?.trim() || null,
    });
  }

  for (let i = 0; i < draft.certificates.length; i++) {
    const cert = draft.certificates[i];
    if (!cert.title.trim()) continue;
    await resumeService.addCertificate(resumeId, {
      title: cert.title.trim(),
      issueDate: normalizeDateInput(cert.issueDate) || today,
      description: cert.description?.trim() || null,
    });
  }

  return resumeId;
}
