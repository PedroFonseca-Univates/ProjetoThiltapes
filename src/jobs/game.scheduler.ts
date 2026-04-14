import cron from "node-cron";
import databaseService from "../database.service";
import { GameStatus } from "../entities/Game.entity";
import { LessThanOrEqual } from "typeorm";

/**
 * Roda a cada minuto e encerra jogos cujo endAt já passou.
 * Jogos encerrados por tempo não têm vencedor (winnerId = null).
 */
export function startGameScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const gameRepository = databaseService.getGameRepository();
      const now = new Date();

      const result = await gameRepository.update(
        {
          status: GameStatus.ACTIVE,
          endAt: LessThanOrEqual(now),
        },
        {
          status: GameStatus.FINISHED,
          endedAt: now,
        },
      );

      if (result.affected && result.affected > 0) {
        console.log(
          `[Scheduler] ${result.affected} jogo(s) encerrado(s) por tempo esgotado.`,
        );
      }
    } catch (error) {
      console.error("[Scheduler] Erro ao atualizar jogos expirados:", error);
    }
  });

  console.log("[Scheduler] Game scheduler iniciado.");
}
