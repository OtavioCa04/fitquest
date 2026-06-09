import type { Request, Response } from "express";
import { getBearerToken } from "./auth";
import { getUserById, pool } from "./db";
import type { AuthenticatedHandler, UserRow } from "./server-types";

export async function getCurrentUser(req: Request): Promise<UserRow | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  await pool.query("DELETE FROM sessions WHERE created_at < NOW() - INTERVAL 30 DAY");
  const [rows] = await pool.query(
    "SELECT user_id FROM sessions WHERE token = ? AND created_at > NOW() - INTERVAL 30 DAY LIMIT 1",
    [token]
  );
  const session = (rows as Array<{ user_id: number }>)[0];
  if (!session) return null;

  return getUserById(session.user_id);
}

export function authRequired(handler: AuthenticatedHandler) {
  return async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Voce precisa fazer login." });
      return;
    }
    await handler(req, res, user);
  };
}
