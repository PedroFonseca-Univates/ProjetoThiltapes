import "dotenv/config";
import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./database";

import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import thiltapeRoutes from "./routes/thiltape.routes";
import findingRoutes from "./routes/finding.routes";
import { startGameScheduler } from "./jobs/game.scheduler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Thiltapes API" });
});

app.use("/auth", authRoutes);
app.use("/games", gameRoutes);
app.use("/thiltapes", thiltapeRoutes);
app.use("/findings", findingRoutes);

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("[TypeORM] Banco de dados conectado com sucesso.");

    app.listen(PORT, () => {
      console.log(
        `[Thiltapes API] Servidor rodando em http://localhost:${PORT}.`,
      );
      startGameScheduler();
    });
  } catch (error) {
    console.error("[TypeORM] Erro ao conectar ao banco de dados:", error);
    process.exit(1);
  }
}

startServer();
