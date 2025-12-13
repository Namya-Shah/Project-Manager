export interface DailyLog {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  userId?: string;
  userEmail?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  ownerId: string;
  ownerEmail?: string;
  groupId: string;
  logs: DailyLog[];
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  email: string;
  fullName?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface ActivityDay {
  date: string;
  count: number;
  logs: DailyLog[];
}
