export type UserRole = 'applicant' | 'interviewer' | 'admin';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'interview_done' | 'passed' | 'failed';
export type InterviewMethod = 'offline' | 'online';

export interface User {
  id: string;
  kakao_id: string;
  email?: string;
  name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface InterviewSlot {
  id: string;
  company_id: string;
  interview_date: string;
  start_time: string;
  end_time: string;
  method: InterviewMethod;
  location?: string;
  capacity: number;
  created_at: string;
  company?: Company;
  application_count?: number;
}

export interface Application {
  id: string;
  applicant_id: string;
  slot_id: string;
  status: ApplicationStatus;
  score?: number;
  comment?: string;
  applied_at: string;
  updated_at: string;
  slot?: InterviewSlot;
  applicant?: User;
}

export interface SessionUser {
  userId: string;
  role: UserRole;
  name: string;
}

export interface DashboardData {
  counts: Record<ApplicationStatus, number>;
  delayed: DelayedCase[];
}

export interface DelayedCase {
  id: string;
  applicant_name: string;
  company_name: string;
  status: ApplicationStatus;
  days_since_update: number;
  slot_date: string;
}
