export interface User {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  avatar: string;
  profileId?: number;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  avatar: string;
  profileId?: number;
}

export interface JobSkill {
  skillId?: number;
  skillName?: string;
  level?: string;
  isRequired?: boolean;
}

export interface JobMajor {
  majorId?: number;
  name?: string;
}

export interface JobSocial {
  id?: number;
  platform?: string;
  url?: string;
  logoUrl?: string;
}

export interface Job {
  jobId: number;
  title: string;
  companyId?: number;
  companyName: string;
  companyLogo?: string;
  thumbnailUrl?: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  salaryCurrency?: string;
  hotTag?: string;
  isExpired: boolean;
  isActive?: boolean;
  isApproved?: boolean;
  isDeleted?: boolean;
  postedAt: string;
  deadline?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  companyAddress?: string;
  contactPersonName?: string;
  contactTutorial?: string;
  companySocials?: JobSocial[];
  jobType?: string;
  yearsOfExperience?: string;
  educationLevel?: string;
  categoryId?: number;
  categoryName?: string;
  applicationLanguage?: string;
  genderRequirement?: string;
  minAge?: number;
  maxAge?: number;
  jobSkills?: JobSkill[];
  majors?: JobMajor[];
  viewCount?: number;
  applyCount?: number;
}

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface SavedJob {
  savedJobId: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  hotTag?: string;
  jobType?: string;
  savedAt: string;
}

export interface Application {
  applicationId: number;
  status: string;
  appliedAt: string;
  job: Job;
}

export interface Notification {
  notificationId: number;
  jobTitle: string;
  content: string;
  isRead: boolean;
  applicationId?: number;
  userId: number;
  type: string;
  senderName?: string;
  conversationId?: number;
  createdAt: string;
}

export interface ProfileSkill {
  skillId: number;
  skillName?: string;
  level?: string;
  yearsOfExperience?: number | null;
}

export interface ProfileSocialLink {
  platform: string;
  url: string;
  logoUrl?: string;
}

export interface JobSeekerProfile {
  profileId: number;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  bio?: string;
  address?: string;
  title?: string;
  headline?: string;
  dateOfBirth?: string;
  gender?: string;
  skills?: ProfileSkill[];
  socials?: ProfileSocialLink[];
}

export interface Company {
  companyId: number;
  companyName: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  website?: string;
  companySize?: string;
  industry?: string;
  nameUserContact?: string;
  tutorialApply?: string;
  socials?: JobSocial[];
  followerCount?: number;
  images?: { imageUrl: string; imageType: string }[];
}

export interface CompanyReview {
  reviewId: number;
  userName: string;
  rating: number;
  title: string;
  pros: string;
  cons: string;
  recommend: boolean;
  status: string;
  createdAt: string;
}

export interface Resume {
  resumeId: number;
  title: string;
  resumeName?: string;
  summary?: string;
  isPrimary?: boolean;
  fileUrl?: string;
  resumeUrl?: string;
  hasParsedCv?: boolean;
  templateKey?: string;
  createdAt?: string;
}

export interface Education {
  id: number;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface WorkExperience {
  id: number;
  companyName: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrentJob?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certificate {
  id: number;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expirationDate?: string;
  credentialUrl?: string;
}

export interface HandbookPost {
  postId: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl?: string;
  categoryKey?: string;
  companyName?: string;
  companyLogoUrl?: string;
  publishedAt: string;
}

export interface HandbookDetail {
  postId: number;
  title: string;
  slug: string;
  contentHtml: string;
  featuredImageUrl?: string;
  categoryKey?: string;
  companyName?: string;
  companyLogoUrl?: string;
  publishedAt: string;
}

export interface Conversation {
  conversationId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  attachment?: {
    attachmentId: number;
    fileName: string;
    filePath: string;
    fileType: string;
  };
  sentAt?: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestMessageId: number | null;
}

export interface JobCategory {
  categoryId: number;
  categoryName: string;
  industryId?: number;
}
