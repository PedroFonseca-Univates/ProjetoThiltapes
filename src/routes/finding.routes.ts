import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../auth.middleware";
import { registerFinding, listFindings } from "../services/finding.service";

const router = Router();

// Registrar que encontrou um thiltape em um jogo específico
// POST /games/:gameId/finding
router.post("/", authenticate(), async (req: AuthRequest, res: Response) => {
  const {
    gameId,
    thiltapeId,
    photoBase64,
    playerLocationLat,
    playerLocationLng,
  } = req.body;

  if (
    !gameId ||
    !thiltapeId ||
    !photoBase64 ||
    playerLocationLat === undefined ||
    playerLocationLng === undefined
  ) {
    res.status(400).json({
      error:
        "gameId, thiltapeId, photoBase64, playerLocationLat e playerLocationLng são obrigatórios.",
    });
    return;
  }

  try {
    const result = await registerFinding({
      gameId,
      playerId: req.user!.id,
      thiltapeId,
      photoBase64,
      playerLocationLat: parseFloat(playerLocationLat),
      playerLocationLng: parseFloat(playerLocationLng),
    });

    res.status(201).json({
      finding: result.finding,
      isVictory: result.isVictory,
      message: result.isVictory
        ? "🎉 Parabéns! Você coletou todos os thiltapes e venceu o jogo!"
        : "Thiltape coletado com sucesso!",
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar findings do jogador em um jogo específico
// GET /games/:gameId/my-findings
router.get("/", authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.query;
    const findings = await listFindings(
      req.user!.id,
      gameId ? (gameId as string) : undefined,
    );
    res.json(findings);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
