import { Job } from '../services/api/models';
import { getEducationLevelLabel } from '../constants/resumeEnums';

export function formatJobSalary(job: Job): string {
  const sType = (job.salaryType ?? 'RANGE').toUpperCase();
  const sCurrency = job.salaryCurrency ?? 'VND';

  if (sType === 'NEGOTIABLE') return 'Thỏa thuận';
  if (sType === 'COMPETITIVE') return 'Cạnh tranh';

  if (!job.salaryMin && !job.salaryMax) return 'Thỏa thuận';

  const formatAmount = (val: number) => {
    if (sCurrency === 'VND') {
      const millions = val / 1_000_000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)} triệu`;
    }
    return val.toLocaleString('en-US');
  };

  const min = job.salaryMin ? formatAmount(job.salaryMin) : null;
  const max = job.salaryMax ? formatAmount(job.salaryMax) : null;
  const unit = sCurrency !== 'VND' ? ` ${sCurrency}` : '';

  if (min && max) return `${min} - ${max}${unit}`;
  if (min && !max) return `Từ ${min}${unit}`;
  if (!min && max) return `Đến ${max}${unit}`;
  return 'Thỏa thuận';
}

export function formatExperienceText(yearsOfExperience?: string): string {
  if (!yearsOfExperience) return 'Không yêu cầu';
  switch (yearsOfExperience) {
    case '0':
      return 'Không yêu cầu';
    case '1':
      return 'Từ 1 năm';
    case '1-3':
      return '1 - 3 năm';
    case '3-5':
      return '3 - 5 năm';
    case '5+':
      return 'Từ 5 năm trở lên';
    default:
      return yearsOfExperience;
  }
}

export function getDeadlineInfo(job: Job): { dateText: string; diffDays: number } | null {
  const raw = job.deadline;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const dateText = d.toLocaleDateString('vi-VN');
  return { dateText, diffDays };
}

export function getSkillsLine(job: Job): string {
  if (!job.jobSkills?.length) return '—';
  return job.jobSkills
    .map((js) => {
      const lv = js.level ? ` (${js.level})` : '';
      return `${js.skillName ?? ''}${lv}`.trim();
    })
    .filter(Boolean)
    .join(', ');
}

export function getMajorsLine(job: Job): string {
  if (!job.majors?.length) return '—';
  return job.majors.map((m) => m.name).filter(Boolean).join(', ');
}

export function getAgeLine(job: Job): string {
  if (job.minAge != null || job.maxAge != null) {
    return `${job.minAge ?? '—'} - ${job.maxAge ?? '—'}`;
  }
  return 'Không yêu cầu';
}

export function isJobAvailable(job: Job): boolean {
  return (
    job.isActive !== false &&
    job.isApproved !== false &&
    job.isDeleted !== true &&
    job.isExpired !== true
  );
}

export function formatPostedDate(postedAt?: string): string | null {
  if (!postedAt) return null;
  const d = new Date(postedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN');
}

export { getEducationLevelLabel };
