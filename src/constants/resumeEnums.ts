export const EDUCATION_LEVEL_LABELS_VI: Record<string, string> = {
  ANY: 'Bất kỳ',
  HIGH_SCHOOL: 'Trung học phổ thông',
  VOCATIONAL: 'Trung cấp',
  ASSOCIATE: 'Cao đẳng',
  BACHELOR: 'Đại học',
  MASTER: 'Cao học',
  DOCTORATE: 'Tiến sĩ',
  OTHER: 'Khác',
};

export const WORK_EXPERIENCE_LEVELS = [
  { value: 'INTERN', label: 'Thực tập' },
  { value: 'FRESHER', label: 'Mới tốt nghiệp' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MIDDLE', label: 'Middle' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export const WORK_EXPERIENCE_LEVEL_LABELS_VI: Record<string, string> = Object.fromEntries(
  WORK_EXPERIENCE_LEVELS.map((l) => [l.value, l.label])
);

export const JOB_TYPE_LABELS_VI: Record<string, string> = {
  FULL_TIME: 'Nhân viên toàn thời gian',
  PART_TIME: 'Nhân viên bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERNSHIP: 'Thực tập sinh',
  FREELANCE: 'Freelance',
};

function normalizeKey(value: string | undefined): string {
  if (!value) return '';
  return value.toUpperCase().replace(/-/g, '_');
}

export function getEducationLevelLabel(value: string | undefined): string {
  const key = normalizeKey(value);
  return (key && EDUCATION_LEVEL_LABELS_VI[key]) || value || '';
}

export function getWorkExperienceLevelLabel(value: string | undefined): string {
  const key = normalizeKey(value);
  return (key && WORK_EXPERIENCE_LEVEL_LABELS_VI[key]) || value || '';
}

export function getJobTypeLabelVi(value: string | undefined): string {
  const key = normalizeKey(value);
  return (key && JOB_TYPE_LABELS_VI[key]) || value || '';
}

/** Normalize date input to YYYY-MM-DD for API LocalDate fields. */
export function normalizeDateInput(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return null;
}
