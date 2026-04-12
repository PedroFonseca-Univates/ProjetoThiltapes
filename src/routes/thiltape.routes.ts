import { Router, Response } from "express";
import { authenticate, adminOnly, AuthRequest } from "../auth.middleware";
import {
  createThiltape,
  listByGame,
  getThiltape,
  findNearby,
} from "../services/thiltape.service";

const router = Router();

// Listar thiltapes de um jogo
router.get(
  "/game/:gameId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const thiltapes = await listByGame(req.params.gameId);
    res.json(thiltapes);
  },
);

// Buscar thiltapes próximos (geolocalização)
// GET /thiltapes/nearby?lat=-29.74&lng=-51.15&radius=100&gameId=xxx
router.get("/nearby", authenticate, async (req: AuthRequest, res: Response) => {
  const { lat, lng, radius, gameId } = req.query;
  if (!lat || !lng) {
    res.status(400).json({ error: "lat e lng são obrigatórios." });
    return;
  }
  const nearby = await findNearby(
    parseFloat(lat as string),
    parseFloat(lng as string),
    radius ? parseFloat(radius as string) : 100,
    gameId as string | undefined,
  );
  res.json(nearby);
});

// Buscar thiltape por ID (admin vê imagem, player não)
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const t = await getThiltape(req.params.id);
  if (!t) {
    res.status(404).json({ error: "Thiltape não encontrado." });
    return;
  }
  if (req.user?.role !== "ADMIN") {
    const { imageBase64, ...rest } = t;
    res.json(rest);
    return;
  }
  res.json(t);
});

// Criar thiltape (admin)
router.post(
  "/",
  authenticate,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const {
      name,
      description,
      imageBase64,
      latitude,
      longitude,
      radiusMeters,
      gameId,
    } = req.body;
    if (!name || latitude === undefined || longitude === undefined || !gameId) {
      res.status(400).json({
        error: "name, latitude, longitude e gameId são obrigatórios.",
      });
      return;
    }
    try {
      const t = await createThiltape({
        name,
        description,
        imageBase64,
        latitude,
        longitude,
        radiusMeters,
        gameId,
      });
      res.status(201).json(t);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

export default router;
