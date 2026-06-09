import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import type { UserRow, WorkoutRow } from "./server-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_NAME = process.env.DB_NAME || "fitquest";

export let pool: mysql.Pool;

export async function addColumnIfMissing(table: string, column: string, definition: string) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [DB_NAME, table, column]
  );

  if (Number(rows[0]?.total || 0) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  }
}

export async function initDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      username VARCHAR(80) NOT NULL UNIQUE,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(40) DEFAULT '',
      bio TEXT,
      avatar_data LONGTEXT,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      streak INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      intensity ENUM('Leve', 'Moderado', 'Intenso') NOT NULL DEFAULT 'Moderado',
      detail VARCHAR(160) NOT NULL,
      xp INT NOT NULL DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_workouts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token CHAR(36) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_mission_rewards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      mission_id VARCHAR(80) NOT NULL,
      reward_date DATE NOT NULL,
      xp INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_daily_mission_reward (user_id, mission_id, reward_date),
      CONSTRAINT fk_daily_mission_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query("ALTER TABLE users MODIFY password_hash VARCHAR(255) NOT NULL");
  await addColumnIfMissing("users", "phone", "phone VARCHAR(40) DEFAULT ''");
  await addColumnIfMissing("users", "bio", "bio TEXT");
  await addColumnIfMissing("users", "avatar_data", "avatar_data LONGTEXT");
  await addColumnIfMissing("users", "xp", "xp INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("users", "level", "level INT NOT NULL DEFAULT 1");
  await addColumnIfMissing("users", "streak", "streak INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("workouts", "xp", "xp INT NOT NULL DEFAULT 50");
}

export async function getUserById(userId: number) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [userId]);
  return (rows[0] as UserRow | undefined) || null;
}

export async function getUserWorkouts(userId: number) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC",
    [userId]
  );
  return rows as WorkoutRow[];
}
