import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Game } from "./Game.entity";
import { GamePlayer } from "./GamePlayer.entity";
import { Finding } from "./Finding.entity";

export enum Role {
  ADMIN = "ADMIN",
  PLAYER = "PLAYER",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  username: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.PLAYER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @OneToMany(() => Game, (game) => game.createdByUser)
  createdGames: Game[];

  // OneToMany pois um usuário pode vencer múltiplos jogos
  @OneToMany(() => Game, (game) => game.winner)
  wonGames: Game[];

  @OneToMany(() => GamePlayer, (gamePlayer) => gamePlayer.player)
  gameParticipations: GamePlayer[];

  @OneToMany(() => Finding, (finding) => finding.player)
  findings: Finding[];
}
