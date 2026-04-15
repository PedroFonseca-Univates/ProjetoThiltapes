import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Point } from "typeorm";
import { User } from "./User.entity";
import { GameThiltape } from "./GameThiltape.entity";
import { GamePlayer } from "./GamePlayer.entity";

export enum GameStatus {
  WAITING = "WAITING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

@Entity("games")
export class Game {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "enum", enum: GameStatus, default: GameStatus.WAITING })
  status: GameStatus;

  @Column({ type: "timestamp", nullable: true })
  startAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  endAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  endedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date | null;

  @Column({ type: "integer", default: 1000 })
  gameRadiusMeters: number;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  location: Point;

  @Column({ type: "integer", default: 60 })
  countdownMinutes: number;

  @Column({ type: "integer" })
  thiltapesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.createdGames)
  @JoinColumn({ name: "createdBy" })
  createdByUser: User;

  @Column({ type: "uuid", name: "createdBy" })
  createdBy: string;

  // ManyToOne pois um usuário pode vencer múltiplos jogos
  // (OneToOne criava UNIQUE em winnerId, impedindo o mesmo player de ganhar mais de um jogo)
  @ManyToOne(() => User, (user) => user.wonGames, { nullable: true })
  @JoinColumn({ name: "winnerId" })
  winner: User | null;

  @Column({ type: "uuid", nullable: true })
  winnerId: string | null;

  @OneToMany(() => GameThiltape, (gt) => gt.game, {
    cascade: true,
  })
  gameThiltapes: GameThiltape[];

  @OneToMany(() => GamePlayer, (gamePlayer) => gamePlayer.game, {
    cascade: true,
  })
  players: GamePlayer[];
}
