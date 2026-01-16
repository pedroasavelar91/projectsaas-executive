
export enum AppView {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS', // This is the Kanban
  TIMELINE = 'TIMELINE',
  TEAM_MANAGEMENT = 'TEAM_MANAGEMENT',
  PROFILE = 'PROFILE',
  TODO = 'TODO'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface Sector {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  author_id?: string;
  timestamp: string;
}

export interface SubTask {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  taskDescription: string;
  progress: number; // 0 to 100
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  joinedAt: string;
  corporation: string;
  sectors: string[]; // IDs of sectors the user belongs to
  status?: 'APPROVED' | 'PENDING';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'A fazer' | 'Em curso' | 'Revisão' | 'Concluído' | 'Backlog';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  projectLeadId: string; // Responsible for the project
  subTasks: SubTask[]; // Designados with specific tasks and progress
  dueDate: string;
  sectors?: string[]; // New: Multiple sectors support
  sectorId?: string; // Search legacy, to be deprecated
  comments?: Comment[];
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string; // Deadline for the timeline
}

export interface TeamActivity {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  time: string;
  extra?: string;
}
