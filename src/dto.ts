import { buildAchievements, calculateStreak, countTrainingDays, formatDate, formatTime } from "./achievements";
import { getUserWorkouts } from "./db";
import type { UserRow, WorkoutRow } from "./server-types";

export function workoutDto(workout: WorkoutRow) {
  return {
    id: workout.id,
    userId: workout.user_id,
    type: workout.type,
    date: formatDate(workout.date),
    startTime: formatTime(workout.start_time),
    endTime: formatTime(workout.end_time),
    intensity: workout.intensity,
    detail: workout.detail,
    xp: workout.xp,
  };
}

export function userDto(user: UserRow, workouts: WorkoutRow[]) {
  const achievements = buildAchievements(workouts, user.xp || 0);
  const level = Math.max(1, Math.floor((user.xp || 0) / 1000) + 1);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone || "",
    bio: user.bio || "",
    avatarData: user.avatar_data || "",
    xp: user.xp || 0,
    level,
    streak: calculateStreak(workouts),
    totalWorkouts: countTrainingDays(workouts),
    achievementsCount: achievements.filter((achievement) => achievement.unlocked).length,
    maxXp: level * 1000,
    createdAt: user.created_at,
  };
}

export async function dashboardPayload(user: UserRow) {
  const workouts = await getUserWorkouts(user.id);
  const achievements = buildAchievements(workouts, user.xp || 0);
  return {
    user: userDto(user, workouts),
    workouts: workouts.map(workoutDto),
    achievements,
  };
}
