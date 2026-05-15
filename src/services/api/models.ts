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
  salaryCurrency?: string;
  hotTag?: string;
  isExpired: boolean;
  postedAt: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  companyAddress?: string;
  jobType?: string;
  yearsOfExperience?: string;
  educationLevel?: string;
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

export interface JobSeekerProfile {
  profileId: number;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  bio?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  skills?: any[];
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
  summary?: string;
  isPrimary?: boolean;
  fileUrl?: string;
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
  createdAt: string;
  isRead: boolean;
}

export interface JobCategory {
  categoryId: number;
  categoryName: string;
  industryId?: number;
}
