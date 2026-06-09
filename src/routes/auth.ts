import express from "express";
import rateLimit from "express-rate-limit";
import type mysql from "mysql2/promise";
import { createToken, deleteToken, getBearerToken, hashPassword, verifyPassword } from "../auth";
import { getUserById, pool } from "../db";
import { dashboardPayload } from "../dto";
import { authRequired } from "../middleware";
import type { UserRow } from "../server-types";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

function requireString(value: unknown, field: string, min = 1) {
  if (typeof value !== "string" || value.trim().length < min) {
    throw new Error(`Campo obrigatorio invalido: ${field}`);
  }
  return value.trim();
}

function normalizeUsername(username: string) {
  const cleaned = username.trim();
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

function validatePassword(password: string) {
  const rules = [
    { valid: password.length >= 8, message: "A senha precisa ter pelo menos 8 caracteres." },
    { valid: /[A-Z]/.test(password), message: "A senha precisa ter uma letra maiuscula." },
    { valid: /[0-9]/.test(password), message: "A senha precisa ter um numero." },
    { valid: /[^A-Za-z0-9]/.test(password), message: "A senha precisa ter um caractere especial." },
  ];
  const failed = rules.find((rule) => !rule.valid);
  if (failed) throw new Error(failed.message);
}

export const authRouter = express.Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  try {
    const name = requireString(req.body.name, "name", 3);
    const username = normalizeUsername(requireString(req.body.username, "username", 3));
    const email = requireString(req.body.email, "email", 5).toLowerCase();
    const password = requireString(req.body.password, "password", 6);
    validatePassword(password);

    const [existing] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username, email]
    );

    if (existing.length > 0) {
      res.status(409).json({ error: "Usuario ou email ja cadastrado." });
      return;
    }

    const [result] = await pool.query<mysql.ResultSetHeader>(
      "INSERT INTO users (name, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)",
      [name, username, email, hashPassword(password), "Nova jornada FitQuest iniciada."]
    );

    const user = await getUserById(result.insertId);
    if (!user) throw new Error("Nao foi possivel carregar o usuario criado.");
    res.status(201).json({ token: await createToken(user.id), ...(await dashboardPayload(user)) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Cadastro invalido." });
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  try {
    const identifier = requireString(req.body.identifier ?? req.body.username, "identifier", 3).toLowerCase();
    const password = requireString(req.body.password, "password", 1);
    const username = normalizeUsername(identifier);
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1",
      [identifier, username.toLowerCase()]
    );
    const user = rows[0] as UserRow | undefined;

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: "Usuario/email ou senha invalidos." });
      return;
    }

    res.json({ token: await createToken(user.id), ...(await dashboardPayload(user)) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Login invalido." });
  }
});

authRouter.post("/logout", authRequired(async (req, res) => {
  const token = getBearerToken(req);
  if (token) await deleteToken(token);
  res.status(204).send();
}));
