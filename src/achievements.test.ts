import { describe, expect, it, vi } from "vitest";
import { calculateStreak, buildAchievements, buildDailyMissions } from "./achievements";
import { hashPassword, verifyPassword } from "./auth";
import type { WorkoutRow } from "./server-types";

function workout(date: string): WorkoutRow {
  return {
    id: 1,
    user_id: 1,
    type: "Corrida",
    date,
    start_time: "08:00",
    end_time: "09:00",
    intensity: "Moderado",
    detail: "5 km",
    xp: 50,
    created_at: new Date(`${date}T09:00:00`),
  };
}

describe("calculateStreak", () => {
  it("returns 0 for an empty list", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(calculateStreak([])).toBe(0);
    vi.useRealTimers();
  });

  it("returns 1 for a workout today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(calculateStreak([workout("2026-06-05")])).toBe(1);
    vi.useRealTimers();
  });

  it("returns 2 for workouts yesterday and today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00"));
    expect(calculateStreak([workout("2026-06-04"), workout("2026-06-05")])).toBe(2);
    vi.useRealTimers();
  });
});

describe("buildAchievements", () => {
  it("unlocks no achievements without workouts", () => {
    expect(buildAchievements([], 0).some((achievement) => achievement.unlocked)).toBe(false);
  });

  it("unlocks PRIMEIRO TREINO with one workout", () => {
    const achievements = buildAchievements([workout("2026-06-05")], 50);
    expect(achievements.find((achievement) => achievement.id === "first")?.unlocked).toBe(true);
  });

  it("uses the real km from workout detail", () => {
    const achievements = buildAchievements(
      [{ ...workout("2026-06-05"), detail: "7,5 km" }],
      50
    );
    expect(achievements.find((achievement) => achievement.id === "kms")?.progress).toBe(7.5);
  });
});

describe("buildDailyMissions", () => {
  it("uses the same real km logic as achievements", () => {
    const missions = buildDailyMissions(
      [{ ...workout("2026-06-05"), detail: "5 km" }],
      "2026-06-05"
    );
    expect(missions.find((mission) => mission.id === "daily-km")?.completed).toBe(true);
  });
});

describe("password hashing", () => {
  it("verifies a generated hash", () => {
    const hashed = hashPassword("Senha123!");
    expect(verifyPassword("Senha123!", hashed)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hashed = hashPassword("Senha123!");
    expect(verifyPassword("Errada123!", hashed)).toBe(false);
  });
});
