import express from "express";
import { pool } from "../db";
import { dashboardPayload } from "../dto";
import { authRequired } from "../middleware";

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const meRouter = express.Router();

meRouter.get("/", authRequired(async (_req, res, user) => {
  res.json(await dashboardPayload(user));
}));

meRouter.patch("/", authRequired(async (req, res, user) => {
  const name = optionalString(req.body.name) || user.name;
  const phone = optionalString(req.body.phone);
  const bio = optionalString(req.body.bio);
  const avatarData = optionalString(req.body.avatarData);

  if (avatarData && !avatarData.startsWith("data:image/")) {
    res.status(400).json({ error: "A foto precisa ser uma imagem valida." });
    return;
  }

  await pool.query(
    "UPDATE users SET name = ?, phone = ?, bio = ?, avatar_data = ? WHERE id = ?",
    [name, phone, bio, avatarData || user.avatar_data || "", user.id]
  );

  const updatedUser = { ...user, name, phone, bio, avatar_data: avatarData || user.avatar_data || "" };
  res.json(await dashboardPayload(updatedUser));
}));
