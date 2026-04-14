import databaseService from "../database.service";
import { Finding } from "../entities/Finding.entity";
import { GameStatus } from "../entities/Game.entity";
import { GameThiltape } from "../entities/GameThiltape.entity";
import {
  createPoint,
  getLatFromPoint,
  getLngFromPoint,
} from "./thiltape.service";
import { EntityManager } from "typeorm";

export async function registerFinding(data: {
  gameId: string;
  playerId: string;
  thiltapeId: string;
  photoBase64: string;
  playerLocationLat: number;
  playerLocationLng: number;
}) {
  return databaseService.runInTransaction(async (manager) => {
    const gameThiltapeRepository = manager.getRepository(GameThiltape);
    const gamePlayerRepository = manager.getRepository("GamePlayer");
    const findingRepository = manager.getRepository("Finding");
    const gameRepository = manager.getRepository("Game");

    // Verifica se o thiltape pertence a este jogo
    const gameThiltape = await gameThiltapeRepository.findOne({
      where: {
        gameId: data.gameId,
        thiltapeId: data.thiltapeId,
      },
      relations: ["game"],
    });

    if (!gameThiltape)
      throw new Error("Este thiltape não pertence a este jogo.");

    const game = gameThiltape.game;

    // Jogo deve estar ACTIVE
    if (game.status !== GameStatus.ACTIVE) {
      throw new Error("Este jogo não está ativo.");
    }

    // Verifica se o tempo já expirou
    if (game.endAt && new Date() > game.endAt) {
      throw new Error("O tempo deste jogo já acabou.");
    }

    // Jogador deve estar inscrito no jogo
    const participation = await gamePlayerRepository.findOne({
      where: {
        gameId: data.gameId,
        playerId: data.playerId,
      },
    });

    if (!participation) {
      throw new Error("Você não está participando deste jogo.");
    }

    // Verifica se já encontrou este thiltape
    const existing = await findingRepository.findOne({
      where: {
        playerId: data.playerId,
        thiltapeId: data.thiltapeId,
      },
    });

    if (existing) throw new Error("Você já encontrou este thiltape.");

    // Registra o finding
    const finding = new Finding();
    finding.photoBase64 = data.photoBase64;
    finding.location = createPoint(
      data.playerLocationLng,
      data.playerLocationLat,
    );
    finding.playerId = data.playerId;
    finding.thiltapeId = data.thiltapeId;

    const savedFinding = await findingRepository.save(finding);

    // Verifica vitória dentro da transação
    const gameThiltapesCount = await gameThiltapeRepository.count({
      where: { gameId: data.gameId },
    });

    const playerFindingsCount = await findingRepository.count({
      where: {
        playerId: data.playerId,
        thiltape: {
          gameThiltapes: {
            gameId: data.gameId,
          },
        },
      },
      relations: ["thiltape", "thiltape.gameThiltapes"],
    });

    let isVictory = false;
    if (gameThiltapesCount > 0 && playerFindingsCount >= gameThiltapesCount) {
      // Atualiza o jogo com o vencedor
      await gameRepository.update(
        { id: data.gameId },
        {
          status: GameStatus.FINISHED,
          endedAt: new Date(),
          winnerId: data.playerId,
        },
      );
      isVictory = true;
    }

    return {
      finding: savedFinding,
      isVictory,
    };
  });
}

export async function listFindings(playerId: string, gameId?: string) {
  const findingRepository = databaseService.getFindingRepository();
  const gameThiltapeRepository = databaseService.getRepository(GameThiltape);

  let findings = await findingRepository
    .createQueryBuilder("finding")
    .leftJoinAndSelect("finding.thiltape", "thiltape")
    .where("finding.playerId = :playerId", { playerId });

  if (gameId) {
    findings = findings.andWhere(
      `finding.thiltapeId IN (
        SELECT gt.thiltapeId FROM game_thiltapes gt WHERE gt.gameId = :gameId
      )`,
      { gameId },
    );
  }

  const results = await findings
    .select([
      "finding.id",
      "finding.photoBase64",
      "finding.location",
      "finding.foundAt",
      "thiltape.id",
      "thiltape.name",
    ])
    .orderBy("finding.foundAt", "DESC")
    .getMany();

  return results.map((f) => ({
    thiltapeId: f.thiltapeId,
    thiltapeName: f.thiltape.name,
    photoBase64: f.photoBase64,
    playerLocationLat: getLatFromPoint(f.location),
    playerLocationLng: getLngFromPoint(f.location),
    foundAt: f.foundAt,
  }));
}
