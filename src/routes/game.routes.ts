import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../auth.middleware";
import {
  createGame,
  listGames,
  getGame,
  joinGame,
  leaveGame,
  startGame,
  finishGame,
  getNearbyThiltapes,
} from "../services/game.service";
import { registerFinding, listFindings } from "../services/finding.service";
import { getLatFromPoint, getLngFromPoint } from "../services/thiltape.service";

const router = Router();

// Listar jogos (todos os autenticados)
// GET /games?onlyActive=true
router.get("/", authenticate(), async (req: AuthRequest, res: Response) => {
  const onlyActive = req.query.onlyActive === "true";
  const games = await listGames(onlyActive);
  res.json(games);
});

// Buscar jogo por ID
router.get("/:id", authenticate(), async (req: AuthRequest, res: Response) => {
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
  authenticate("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    const {
      name,
      description,
      adminLocationLat,
      adminLocationLng,
      gameRadiusMeters,
      thiltapesCount,
      countdownMinutes,
    } = req.body;

    if (
      !name ||
      adminLocationLat === undefined ||
      adminLocationLng === undefined ||
      thiltapesCount === undefined
    ) {
      res.status(400).json({
        error:
          "name, adminLocationLat, adminLocationLng, thiltapesCount são obrigatórios.",
      });
      return;
    }

    if (thiltapesCount < 1) {
      res.status(400).json({
        error: "thiltapesCount deve ser no mínimo 1.",
      });
      return;
    }

    try {
      const game = await createGame({
        name,
        description,
        adminLocationLat,
        adminLocationLng,
        gameRadiusMeters,
        thiltapesCount,
        countdownMinutes,
        createdBy: req.user!.id,
      });
      res.status(201).json(game);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Iniciar jogo (admin) — muda status de WAITING para ACTIVE
router.post(
  "/:id/start",
  authenticate("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const game = await startGame(req.params.id);
      res.json(game);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Encerrar jogo manualmente (admin) — sem vencedor
router.post(
  "/:id/finish",
  authenticate("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const game = await finishGame(req.params.id);
      res.json(game);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Entrar em um jogo (com validação de raio)
router.post(
  "/:id/join",
  authenticate(),
  async (req: AuthRequest, res: Response) => {
    const { playerLocationLat, playerLocationLng } = req.body;
    try {
      const gp = await joinGame(
        req.params.id,
        req.user!.id,
        playerLocationLat,
        playerLocationLng,
      );
      res.status(201).json(gp);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Sair de um jogo
router.delete(
  "/:id/leave",
  authenticate(),
  async (req: AuthRequest, res: Response) => {
    try {
      await leaveGame(req.params.id, req.user!.id);
      res.json({ message: "Você saiu do jogo." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Listar thiltapes próximos de um jogador
router.get(
  "/:id/nearby-thiltapes",
  authenticate(),
  async (req: AuthRequest, res: Response) => {
    console.log(
      "[nearby-thiltapes] Requisição recebida - gameId:",
      req.params.id,
      "playerId:",
      req.user!.id,
    );

    const { playerLocationLat, playerLocationLng } = req.query;

    if (playerLocationLat === undefined || playerLocationLng === undefined) {
      console.log(
        "[nearby-thiltapes] Erro: coordenadas do player não informadas",
      );
      res.status(400).json({
        error: "playerLocationLat e playerLocationLng são obrigatórios.",
      });
      return;
    }

    console.log("[nearby-thiltapes] Localizacao do player:", {
      lat: playerLocationLat,
      lng: playerLocationLng,
    });

    try {
      const nearby = await getNearbyThiltapes(
        req.params.id,
        req.user!.id,
        parseFloat(playerLocationLat as string),
        parseFloat(playerLocationLng as string),
      );
      console.log("[nearby-thiltapes] Retornando", nearby.length, "thiltapes");
      res.json(nearby);
    } catch (e: any) {
      console.log("[nearby-thiltapes] Erro:", e.message);
      res.status(400).json({ error: e.message });
    }
  },
);

// Registrar que encontrou um thiltape em um jogo específico
router.post(
  "/:id/finding",
  authenticate(),
  async (req: AuthRequest, res: Response) => {
    const { thiltapeId, photoBase64, playerLocationLat, playerLocationLng } =
      req.body;

    if (
      !thiltapeId ||
      !photoBase64 ||
      playerLocationLat === undefined ||
      playerLocationLng === undefined
    ) {
      res.status(400).json({
        error:
          "thiltapeId, photoBase64, playerLocationLat e playerLocationLng são obrigatórios.",
      });
      return;
    }

    try {
      const result = await registerFinding({
        gameId: req.params.id,
        playerId: req.user!.id,
        thiltapeId,
        photoBase64,
        playerLocationLat: parseFloat(playerLocationLat),
        playerLocationLng: parseFloat(playerLocationLng),
      });

      res.status(201).json({
        findingId: result.finding.id,
        isVictory: result.isVictory,
        finding: {
          id: result.finding.id,
          photoBase64: result.finding.photoBase64,
          playerLocationLat: getLatFromPoint(result.finding.location),
          playerLocationLng: getLngFromPoint(result.finding.location),
          foundAt: result.finding.foundAt,
        },
        message: result.isVictory
          ? "🎉 Parabéns! Você coletou todos os thiltapes e venceu o jogo!"
          : "Thiltape coletado com sucesso!",
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

// Listar findings do jogador em um jogo específico
router.get(
  "/:id/my-findings",
  authenticate(),
  async (req: AuthRequest, res: Response) => {
    try {
      const findings = await listFindings(req.user!.id, req.params.id);
      res.json(findings);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

export default router;
