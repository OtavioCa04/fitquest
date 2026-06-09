import express from "express";
import type mysql from "mysql2/promise";
import { buildDailyMissions } from "../achievements";
import { getUserById, getUserWorkouts, pool } from "../db";
import { dashboardPayload, workoutDto } from "../dto";
import { authRequired } from "../middleware";
import type { Intensity, WorkoutRow } from "../server-types";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

function requireString(value: unknown, field: string, min = 1) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw new Error(`Campo obrigatorio invalido: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function xpForIntensity(intensity: Intensity) {
  return { Leve: 25, Moderado: 50, Intenso: 75 }[intensity] || 50;
}

async function awardCompletedDailyMissions(userId: number, rewardDate: string) {
  const workouts = await getUserWorkouts(userId);
  const completedMissions = buildDailyMissions(workouts, rewardDate).filter(
    (mission) => mission.completed,
  );

  if (completedMissions.length === 0) return 0;

  let awardedXp = 0;
  for (const mission of completedMissions) {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      "INSERT IGNORE INTO daily_mission_rewards (user_id, mission_id, reward_date, xp) VALUES (?, ?, ?, ?)",
      [userId, mission.id, rewardDate, mission.reward]
    );
    if (result.affectedRows > 0) awardedXp += mission.reward;
  }

  if (awardedXp > 0) {
    await pool.query("UPDATE users SET xp = xp + ? WHERE id = ?", [awardedXp, userId]);
  }

  return awardedXp;
}

export const workoutsRouter = express.Router();

workoutsRouter.get("/", authRequired(async (_req, res, user) => {
  const workouts = await getUserWorkouts(user.id);
  res.json(workouts.map(workoutDto));
}));

workoutsRouter.post("/", authRequired(async (req, res, user) => {
  try {
    const intensity = requireString(req.body.intensity, "intensity") as Intensity;
    if (!["Leve", "Moderado", "Intenso"].includes(intensity)) {
      res.status(400).json({ error: "Intensidade invalida." });
      return;
    }

    const date = requireString(req.body.date, "date", 10);
    const startTime = requireString(req.body.startTime, "startTime", 4);
    const endTime = requireString(req.body.endTime, "endTime", 4);

    if (!dateRegex.test(date)) {
      res.status(400).json({ error: "Data invalida. Use o formato YYYY-MM-DD." });
      return;
    }

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({ error: "Hora invalida. Use o formato HH:mm." });
      return;
    }

    const payload = {
      type: requireString(req.body.type, "type", 2),
      date,
      startTime,
      endTime,
      intensity,
      detail: optionalString(req.body.detail) || intensity,
      xp: xpForIntensity(intensity),
    };

    const [result] = await pool.query<mysql.ResultSetHeader>(
      "INSERT INTO workouts (user_id, type, date, start_time, end_time, intensity, detail, xp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user.id, payload.type, payload.date, payload.startTime, payload.endTime, payload.intensity, payload.detail, payload.xp]
    );

    await pool.query("UPDATE users SET xp = xp + ? WHERE id = ?", [payload.xp, user.id]);
    await awardCompletedDailyMissions(user.id, payload.date);

    const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT * FROM workouts WHERE id = ?", [result.insertId]);
    const updatedUser = await getUserById(user.id);
    if (!updatedUser) throw new Error("Usuario nao encontrado.");

    res.status(201).json({
      workout: workoutDto(rows[0] as WorkoutRow),
      ...(await dashboardPayload(updatedUser)),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Treino invalido." });
  }
}));
