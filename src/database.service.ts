import { AppDataSource } from "./database";
import { Repository, EntityManager, ObjectLiteral } from "typeorm";
import { User } from "./entities/User.entity";
import { Game } from "./entities/Game.entity";
import { Thiltape } from "./entities/Thiltape.entity";
import { Finding } from "./entities/Finding.entity";
import { GamePlayer } from "./entities/GamePlayer.entity";
import { GameThiltape } from "./entities/GameThiltape.entity";

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getRepository<T extends ObjectLiteral>(
    entity: new () => T,
  ): Repository<T> {
    return AppDataSource.getRepository(entity);
  }

  public getEntityManager(): EntityManager {
    return AppDataSource.manager;
  }

  public async runInTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Convenience methods for common entities
  public getUserRepository(): Repository<User> {
    return this.getRepository(User);
  }

  public getGameRepository(): Repository<Game> {
    return this.getRepository(Game);
  }

  public getThiltapeRepository(): Repository<Thiltape> {
    return this.getRepository(Thiltape);
  }

  public getFindingRepository(): Repository<Finding> {
    return this.getRepository(Finding);
  }

  public getGamePlayerRepository(): Repository<GamePlayer> {
    return this.getRepository(GamePlayer);
  }

  public getGameThiltapeRepository(): Repository<GameThiltape> {
    return this.getRepository(GameThiltape);
  }
}

export default DatabaseService.getInstance();
