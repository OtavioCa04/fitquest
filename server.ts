import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { DB_NAME, initDatabase, pool } from "./src/db";
import { authRouter } from "./src/routes/auth";
import { meRouter } from "./src/routes/me";
import { workoutsRouter } from "./src/routes/workouts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: "12mb" }));

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, app: "FitQuest API", database: DB_NAME });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/workouts", workoutsRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint nao encontrado." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitQuest rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Erro ao iniciar o servidor:", error.message);
  process.exit(1);
});
