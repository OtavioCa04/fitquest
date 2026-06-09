export type Intensity = "Leve" | "Moderado" | "Intenso";

export interface UserAccount {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarData: string;
  xp: number;
  level: number;
  streak: number;
  totalWorkouts: number;
  achievementsCount: number;
  maxXp: number;
  createdAt: string;
}

export interface Workout {
  id: number;
  userId: number;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  intensity: Intensity;
  detail: string;
  xp: number;
}

export interface Achievement {
  id: string;
  title: string;
  progress: number;
  target: number;
  label: string;
  description: string;
  unlocked: boolean;
}

export interface DashboardData {
  user: UserAccount;
  workouts: Workout[];
  achievements: Achievement[];
}
