import crypto from "crypto";
import type { Request } from "express";
import { pool } from "./db";

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

export async function deleteExpiredSessions() {
  await pool.query("DELETE FROM sessions WHERE created_at < NOW() - INTERVAL 30 DAY");
}

export async function createToken(userId: number) {
  await deleteExpiredSessions();
  const token = crypto.randomUUID();
  await pool.query("INSERT INTO sessions (token, user_id) VALUES (?, ?)", [token, userId]);
  return token;
}

export function getBearerToken(req: Request) {
  const header = req.header("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export async function deleteToken(token: string) {
  await deleteExpiredSessions();
  await pool.query("DELETE FROM sessions WHERE token = ?", [token]);
}
