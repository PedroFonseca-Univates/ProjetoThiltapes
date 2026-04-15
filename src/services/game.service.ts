import databaseService from "../database.service";
import { Game, GameStatus } from "../entities/Game.entity";
import { GamePlayer } from "../entities/GamePlayer.entity";
import { GameThiltape } from "../entities/GameThiltape.entity";
import { In } from "typeorm";
import {
  createPoint,
  getLatFromPoint,
  getLngFromPoint,
} from "./thiltape.service";

export async function createGame(data: {
  name: string;
  description?: string;
  adminLocationLat: number;
  adminLocationLng: number;
  gameRadiusMeters?: number;
  thiltapesCount: number;
  countdownMinutes?: number;
  createdBy: string;
}) {
  const gameRepository = databaseService.getGameRepository();
  const thiltapeRepository = databaseService.getThiltapeRepository();

  // Verificar se há thiltapes disponíveis no pool global
  const availableThiltapesCount = await thiltapeRepository.count();
  if (availableThiltapesCount === 0) {
    throw new Error(
      "Não há thiltapes disponíveis no pool global. Crie pelo menos um thiltape antes de criar um jogo.",
    );
  }

  const game = new Game();
  game.name = data.name;
  game.description = data.description || null;
  game.location = createPoint(data.adminLocationLng, data.adminLocationLat);
  game.gameRadiusMeters = data.gameRadiusMeters || 1000;
  game.countdownMinutes = data.countdownMinutes || 60;
  game.thiltapesCount = data.thiltapesCount;
  game.createdBy = data.createdBy;
  game.status = GameStatus.WAITING;

  const savedGame = await gameRepository.save(game);
  await generateThiltapesForGame(
    savedGame.id,
    data.adminLocationLat,
    data.adminLocationLng,
    savedGame.gameRadiusMeters,
    savedGame.thiltapesCount,
  );

  return savedGame;
}

export async function listGames(onlyActive = false) {
  const gameRepository = databaseService.getGameRepository();

  const whereClause = onlyActive ? { status: GameStatus.ACTIVE } : {};

  return gameRepository.find({
    where: whereClause,
    relations: ["createdByUser", "winner", "gameThiltapes", "players"],
    order: { createdAt: "DESC" },
  });
}

export async function getGame(id: string) {
  const gameRepository = databaseService.getGameRepository();

  return gameRepository.findOne({
    where: { id },
    relations: ["createdByUser", "winner", "gameThiltapes", "players"],
  });
}

/**
 * Gera thiltapes aleatórios para um jogo dentro do raio especificado.
 */
export async function generateThiltapesForGame(
  gameId: string,
  adminLat: number,
  adminLng: number,
  radius: number,
  count: number,
): Promise<GameThiltape[]> {
  const thiltapeRepository = databaseService.getThiltapeRepository();
  const gameThiltapeRepository = databaseService.getRepository(GameThiltape);

  // Get all public thiltapes
  const allThiltapes = await thiltapeRepository.find();

  if (allThiltapes.length === 0) {
    throw new Error("Nenhum thiltape disponível no pool global.");
  }

  const selectedThiltapes: typeof allThiltapes = [];
  const shuffledThiltapes = [...allThiltapes].sort(() => Math.random() - 0.5);

  if (count <= shuffledThiltapes.length) {
    selectedThiltapes.push(...shuffledThiltapes.slice(0, count));
  } else {
    selectedThiltapes.push(...shuffledThiltapes);
    while (selectedThiltapes.length < count) {
      const randomThiltape =
        allThiltapes[Math.floor(Math.random() * allThiltapes.length)];
      selectedThiltapes.push(randomThiltape);
    }
  }

  // Create GameThiltape entries with random coordinates within radius
  const gameThiltapes: GameThiltape[] = [];
  for (const thiltape of selectedThiltapes) {
    const { lat, lng } = generateRandomCoordinateInRadius(
      adminLat,
      adminLng,
      radius,
    );

    const gt = new GameThiltape();
    gt.gameId = gameId;
    gt.thiltapeId = thiltape.id;
    gt.location = createPoint(lng, lat);

    gameThiltapes.push(gt);
  }

  await gameThiltapeRepository.save(gameThiltapes);
  return gameThiltapes;
}

/**
 * Inicia um jogo: muda status para ACTIVE e gera thiltapes.
 */
export async function startGame(id: string) {
  const gameRepository = databaseService.getGameRepository();

  const game = await gameRepository.findOne({
    where: { id },
    relations: ["gameThiltapes"],
  });

  if (!game) throw new Error("Jogo não encontrado.");
  if (game.status !== GameStatus.WAITING)
    throw new Error("Jogo já foi iniciado ou encerrado.");

  // Se ainda não tem thiltapes, gera agora
  if (game.gameThiltapes.length === 0) {
    if (!game.location) {
      throw new Error("Localização do admin não definida.");
    }

    await generateThiltapesForGame(
      id,
      getLatFromPoint(game.location),
      getLngFromPoint(game.location),
      game.gameRadiusMeters,
      game.thiltapesCount,
    );
  }

  game.status = GameStatus.ACTIVE;
  game.startedAt = new Date();
  game.startAt = new Date(); // Keep for backwards compatibility
  game.endAt = new Date(Date.now() + game.countdownMinutes * 60 * 1000);

  return gameRepository.save(game);
}

/**
 * Encerra um jogo manualmente (admin). Nenhum vencedor é registrado.
 */
export async function finishGame(id: string) {
  const gameRepository = databaseService.getGameRepository();

  const game = await gameRepository.findOneBy({ id });
  if (!game) throw new Error("Jogo não encontrado.");
  if (game.status === GameStatus.FINISHED)
    throw new Error("Jogo já está encerrado.");

  game.status = GameStatus.FINISHED;
  game.endedAt = new Date();
  return gameRepository.save(game);
}

/**
 * Encerra um jogo com um vencedor (chamado internamente).
 */
export async function finishGameWithWinner(gameId: string, winnerId: string) {
  const gameRepository = databaseService.getGameRepository();

  const game = await gameRepository.findOneBy({ id: gameId });
  if (!game) throw new Error("Jogo não encontrado.");

  game.status = GameStatus.FINISHED;
  game.endedAt = new Date();
  game.winnerId = winnerId;
  return gameRepository.save(game);
}

/**
 * Entra em um jogo com validação de raio. Só pode entrar em jogos WAITING ou ACTIVE.
 */
export async function joinGame(
  gameId: string,
  playerId: string,
  playerLat?: number,
  playerLng?: number,
) {
  const gameRepository = databaseService.getGameRepository();
  const gamePlayerRepository = databaseService.getGamePlayerRepository();

  const game = await gameRepository.findOneBy({ id: gameId });
  if (!game) throw new Error("Jogo não encontrado.");
  if (game.status === GameStatus.FINISHED)
    throw new Error("Este jogo já foi encerrado.");

  // Valida raio se coordenadas foram passadas
  if (playerLat !== undefined && playerLng !== undefined) {
    const adminLat = getLatFromPoint(game.location);
    const adminLng = getLngFromPoint(game.location);
    const distance = haversineDistance(
      adminLat,
      adminLng,
      playerLat,
      playerLng,
    );
    if (distance > game.gameRadiusMeters) {
      throw new Error(
        `Você está fora da área de jogo. Distância: ${Math.round(distance)}m, raio: ${game.gameRadiusMeters}m`,
      );
    }
  }

  const activeParticipation = await gamePlayerRepository.findOne({
    where: {
      playerId,
      game: {
        status: In([GameStatus.WAITING, GameStatus.ACTIVE]),
      },
    },
    relations: ["game"],
  });

  if (activeParticipation) {
    throw new Error(
      "Você já está participando de um jogo ativo. Saia dele antes de entrar em outro.",
    );
  }

  const gamePlayer = new GamePlayer();
  gamePlayer.gameId = gameId;
  gamePlayer.playerId = playerId;

  return gamePlayerRepository.save(gamePlayer);
}

/**
 * Sai de um jogo. Só pode sair de jogos WAITING ou ACTIVE.
 */
export async function leaveGame(gameId: string, playerId: string) {
  const gamePlayerRepository = databaseService.getGamePlayerRepository();

  const participation = await gamePlayerRepository.findOne({
    where: { gameId, playerId },
    relations: ["game"],
  });

  if (!participation) throw new Error("Você não está participando deste jogo.");
  if (participation.game.status === GameStatus.FINISHED)
    throw new Error("Não é possível sair de um jogo encerrado.");

  await gamePlayerRepository.delete({ gameId, playerId });
}

/**
 * Lista thiltapes próximos do jogador, ordenados por distância.
 */
export async function getNearbyThiltapes(
  gameId: string,
  playerId: string,
  playerLat: number,
  playerLng: number,
) {
  const gameThiltapeRepository = databaseService.getRepository(GameThiltape);
  const findingRepository = databaseService.getFindingRepository();

  console.log("[getNearbyThiltapes] gameId:", gameId);
  console.log("[getNearbyThiltapes] playerId:", playerId);
  console.log("[getNearbyThiltapes] playerLocation:", {
    lat: playerLat,
    lng: playerLng,
  });

  // Get all game thiltapes for this specific game
  const gameThiltapes = await gameThiltapeRepository.find({
    where: { gameId },
    relations: ["thiltape"],
  });

  console.log(
    "[getNearbyThiltapes] Found",
    gameThiltapes.length,
    "thiltapes in this game",
  );

  // Get player's findings ONLY for this specific game
  const playerFindings = await findingRepository.find({
    where: {
      playerId,
      gameThiltape: {
        gameId,
      },
    },
    relations: ["gameThiltape"],
  });

  console.log(
    "[getNearbyThiltapes] Player already found",
    playerFindings.length,
    "thiltapes in this game",
  );

  const foundGameThiltapeIds = new Set(
    playerFindings.map((f) => f.gameThiltapeId),
  );

  // Calculate distances and add found status
  const nearbyWithDistance = gameThiltapes
    .map((gt) => {
      const gtLat = getLatFromPoint(gt.location);
      const gtLng = getLngFromPoint(gt.location);

      return {
        id: gt.thiltape.id,
        name: gt.thiltape.name,
        description: gt.thiltape.description,
        imageBase64: gt.thiltape.imageBase64,
        position: {
          lat: gtLat,
          lng: gtLng,
        },
        distanceMeters: haversineDistance(playerLat, playerLng, gtLat, gtLng),
        isFound: foundGameThiltapeIds.has(gt.id),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  console.log(
    "[getNearbyThiltapes] Returning",
    nearbyWithDistance.length,
    "thiltapes sorted by distance",
  );
  if (nearbyWithDistance.length > 0) {
    console.log(
      "[getNearbyThiltapes] Closest thiltape distance:",
      nearbyWithDistance[0].distanceMeters,
      "meters",
    );
    console.log(
      "[getNearbyThiltapes] Farthest thiltape distance:",
      nearbyWithDistance[nearbyWithDistance.length - 1].distanceMeters,
      "meters",
    );
  }

  return nearbyWithDistance;
}

/**
 * Verifica se um jogador coletou todos os thiltapes do jogo.
 * Se sim, encerra o jogo e marca o jogador como vencedor.
 */
export async function checkVictory(
  gameId: string,
  playerId: string,
): Promise<boolean> {
  const gameThiltapeRepository = databaseService.getRepository(GameThiltape);
  const findingRepository = databaseService.getFindingRepository();

  const [totalThiltapes, totalFindings] = await Promise.all([
    gameThiltapeRepository.count({ where: { gameId } }),
    findingRepository.count({
      where: {
        playerId,
        gameThiltape: {
          gameId,
        },
      },
      relations: ["gameThiltape"],
    }),
  ]);

  if (totalThiltapes > 0 && totalFindings >= totalThiltapes) {
    await finishGameWithWinner(gameId, playerId);
    return true;
  }

  return false;
}

/**
 * Calcula a distância entre dois pontos usando Haversine.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Gera uma coordenada aleatória dentro de um raio especificado.
 */
function generateRandomCoordinateInRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): { lat: number; lng: number } {
  const randomDistance = Math.random() * radiusMeters;
  const randomAngle = Math.random() * 2 * Math.PI;

  const R = 6371000; // Earth radius in meters
  const φ1 = (centerLat * Math.PI) / 180;
  const λ1 = (centerLng * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(randomDistance / R) +
      Math.cos(φ1) * Math.sin(randomDistance / R) * Math.cos(randomAngle),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(randomAngle) * Math.sin(randomDistance / R) * Math.cos(φ1),
      Math.cos(randomDistance / R) - Math.sin(φ1) * Math.sin(φ2),
    );

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (λ2 * 180) / Math.PI,
  };
}
