import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Game } from "./Game.entity";
import { User } from "./User.entity";

@Entity("game_players")
@Unique(["game", "player"])
@Index(["game"])
@Index(["player"])
export class GamePlayer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  joinedAt: Date;

  // Relations
  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: "gameId" })
  game: Game;

  @Column({ type: "uuid" })
  gameId: string;

  @ManyToOne(() => User, (user) => user.gameParticipations)
  @JoinColumn({ name: "playerId" })
  player: User;

  @Column({ type: "uuid" })
  playerId: string;
}
