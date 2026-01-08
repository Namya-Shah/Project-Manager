export interface DailyLog {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  ownerId: string;
  ownerEmail?: string;
  groupId?: string | null;
  logs: DailyLog[];
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  activityStatus?: string;
  role: 'admin' | 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface ActivityDay {
  date: string;
  count: number;
  logs: DailyLog[];
}
