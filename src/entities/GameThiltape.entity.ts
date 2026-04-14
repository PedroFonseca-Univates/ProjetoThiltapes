import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { Game } from "./Game.entity";
import { Thiltape } from "./Thiltape.entity";
import { Point } from "typeorm";

@Entity("game_thiltapes")
@Unique(["game", "thiltape"])
@Index(["game"])
@Index(["thiltape"])
@Index(["location"], { spatial: true })
export class GameThiltape {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Game, (game) => game.gameThiltapes)
  @JoinColumn({ name: "gameId" })
  game: Game;

  @Column({ type: "uuid" })
  gameId: string;

  @ManyToOne(() => Thiltape, (thiltape) => thiltape.gameThiltapes)
  @JoinColumn({ name: "thiltapeId" })
  thiltape: Thiltape;

  @Column({ type: "uuid" })
  thiltapeId: string;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: false,
  })
  location: Point;
}
