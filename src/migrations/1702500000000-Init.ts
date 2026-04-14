import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1702500000000 implements MigrationInterface {
  name = "Init1702500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Create Role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'PLAYER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create GameStatus enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."games_status_enum" AS ENUM('WAITING', 'ACTIVE', 'FINISHED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL UNIQUE,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'PLAYER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_username" ON "public"."users" ("username") `,
    );

    // Create games table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."games" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "status" "public"."games_status_enum" NOT NULL DEFAULT 'WAITING',
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "endedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy_id" uuid NOT NULL,
        "winnerId" uuid,
        CONSTRAINT "PK_games" PRIMARY KEY ("id"),
        CONSTRAINT "FK_games_createdBy" FOREIGN KEY ("createdBy_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_games_winner" FOREIGN KEY ("winnerId") REFERENCES "public"."users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_games_createdBy_id" ON "public"."games" ("createdBy_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_games_winnerId" ON "public"."games" ("winnerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_games_status" ON "public"."games" ("status") `,
    );

    // Create thiltapes table with PostGIS Point geometry
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."thiltapes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "imageBase64" text,
        "location" geometry(Point, 4326) NOT NULL,
        "radiusMeters" integer NOT NULL DEFAULT 20,
        "gameId" uuid NOT NULL,
        CONSTRAINT "PK_thiltapes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_thiltapes_game" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_thiltapes_gameId" ON "public"."thiltapes" ("gameId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_thiltapes_location_gist" ON "public"."thiltapes" USING GIST("location") `,
    );

    // Create findings table with PostGIS Point geometry
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."findings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "photoBase64" text,
        "userLocation" geometry(Point, 4326) NOT NULL,
        "foundAt" TIMESTAMP NOT NULL DEFAULT now(),
        "playerId" uuid NOT NULL,
        "thiltapeId" uuid NOT NULL,
        CONSTRAINT "PK_findings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_findings_player" FOREIGN KEY ("playerId") REFERENCES "public"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_findings_thiltape" FOREIGN KEY ("thiltapeId") REFERENCES "public"."thiltapes"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_findings_playerId_thiltapeId" UNIQUE ("playerId", "thiltapeId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_findings_playerId" ON "public"."findings" ("playerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_findings_thiltapeId" ON "public"."findings" ("thiltapeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_findings_userLocation_gist" ON "public"."findings" USING GIST("userLocation") `,
    );

    // Create game_players table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."game_players" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "gameId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        CONSTRAINT "PK_game_players" PRIMARY KEY ("id"),
        CONSTRAINT "FK_game_players_game" FOREIGN KEY ("gameId") REFERENCES "public"."games"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_game_players_player" FOREIGN KEY ("playerId") REFERENCES "public"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_game_players_gameId_playerId" UNIQUE ("gameId", "playerId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_game_players_gameId" ON "public"."game_players" ("gameId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_game_players_playerId" ON "public"."game_players" ("playerId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_game_players_playerId" `,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_players_gameId" `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_findings_userLocation_gist" `,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_thiltapeId" `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_findings_playerId" `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_thiltapes_location_gist" `,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_thiltapes_gameId" `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_status" `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_winnerId" `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_createdBy_id" `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_username" `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."game_players" `);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."findings" `);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."thiltapes" `);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."games" `);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."users" `);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."games_status_enum" `,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum" `);

    // Drop PostGIS extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis CASCADE `);
  }
}
