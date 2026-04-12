import "dotenv/config";
import express from "express";

import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import thiltapeRoutes from "./routes/thiltape.routes";
import findingRoutes from "./routes/finding.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" })); // base64 pode ser grande

app.get("/", (_req, res) => {
  res.json({ message: "Thiltapes API" });
});

app.use("/auth", authRoutes);
app.use("/games", gameRoutes);
app.use("/thiltapes", thiltapeRoutes);
app.use("/findings", findingRoutes);

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
