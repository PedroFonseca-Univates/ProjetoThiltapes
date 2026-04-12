import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../auth.middleware";
import { registerFinding, listFindings } from "../services/finding.service";

const router = Router();

// Registrar que encontrou um thiltape
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { thiltapeId, photoBase64, foundLatitude, foundLongitude } = req.body;
  if (
    !thiltapeId ||
    foundLatitude === undefined ||
    foundLongitude === undefined
  ) {
    res
      .status(400)
      .json({
        error: "thiltapeId, foundLatitude e foundLongitude são obrigatórios.",
      });
    return;
  }
  try {
    const finding = await registerFinding({
      playerId: req.user!.id,
      thiltapeId,
      photoBase64,
      foundLatitude,
      foundLongitude,
    });
    res.status(201).json(finding);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar findings do jogador autenticado
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.query;
  const findings = await listFindings(
    req.user!.id,
    gameId as string | undefined,
  );
  res.json(findings);
});

export default router;
