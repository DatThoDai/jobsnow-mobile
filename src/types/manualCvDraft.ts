export type DraftWorkExp = {
  localId: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type DraftEducation = {
  localId: string;
  title: string;
  educationLevel: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type DraftProject = {
  localId: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type DraftCertificate = {
  localId: string;
  title: string;
  issueDate: string;
  description: string;
};

export type ManualCvDraft = {
  resumeName: string;
  summary: string;
  educations: DraftEducation[];
  experiences: DraftWorkExp[];
  projects: DraftProject[];
  certificates: DraftCertificate[];
};

export function newLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
