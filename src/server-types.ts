import type { Request, Response } from "express";

export type Intensity = "Leve" | "Moderado" | "Intenso";

export type UserRow = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar_data: string | null;
  xp: number;
  level: number;
  streak: number;
  password_hash: string;
  created_at: Date;
};

export type WorkoutRow = {
  id: number;
  user_id: number;
  type: string;
  date: string | Date;
  start_time: string;
  end_time: string;
  intensity: Intensity;
  detail: string;
  xp: number;
  created_at: Date;
};

export type Achievement = {
  id: string;
  title: string;
  progress: number;
  target: number;
  label: string;
  description: string;
  unlocked: boolean;
};

export type AuthenticatedHandler = (req: Request, res: Response, user: UserRow) => Promise<void>;
