import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Game } from "./entities/Game.entity";
import { Thiltape } from "./entities/Thiltape.entity";
import { Finding } from "./entities/Finding.entity";
import { GamePlayer } from "./entities/GamePlayer.entity";
import { GameThiltape } from "./entities/GameThiltape.entity";

require("dotenv").config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  database: process.env.DATABASE_NAME || "projeto-mobile",
  synchronize: true,
  logging: process.env.DATABASE_LOGGING === "true",
  entities: [User, Game, Thiltape, Finding, GamePlayer, GameThiltape],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  extra: {
    max: 20,
  },
});
