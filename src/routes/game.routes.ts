import { Router, Response } from "express";
import { authenticate, adminOnly, AuthRequest } from "../auth.middleware";
import {
  createGame,
  listGames,
  getGame,
  joinGame,
  toggleGame,
} from "../services/game.service";

const router = Router();

// Listar jogos (todos os autenticados)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const games = await listGames();
  res.json(games);
});

// Buscar jogo por ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const game = await getGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: "Jogo não encontrado." });
    return;
  }
  res.json(game);
});

// Criar jogo (admin)
router.post(
  "/",
  authenticate,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const { name, description, startAt, endAt } = req.body;
    if (!name) {
      res.status(400).json({ error: "name é obrigatório." });
      return;
    }
    try {
      const game = await createGame({
        name,
        description,
        startAt,
        endAt,
        createdBy: req.user!.id,
      });
      res.status(201).json(game);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Ativar/desativar jogo (admin)
router.patch(
  "/:id/active",
  authenticate,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      res.status(400).json({ error: "active deve ser boolean." });
      return;
    }
    const game = await toggleGame(req.params.id, active);
    res.json(game);
  },
);

// Entrar em um jogo (player)
router.post(
  "/:id/join",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const gp = await joinGame(req.params.id, req.user!.id);
      res.status(201).json(gp);
    } catch (e: any) {
      res
        .status(400)
        .json({ error: "Você já está neste jogo ou jogo não existe." });
    }
  },
);

export default router;
