import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";
import { GameThiltape } from "./GameThiltape.entity";
import { Point } from "typeorm";

@Entity("findings")
@Index(["player"])
@Index(["gameThiltape"])
@Index(["location"], { spatial: true })
export class Finding {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  photoBase64: string | null;

  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: false,
  })
  location: Point;

  @CreateDateColumn()
  foundAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.findings)
  @JoinColumn({ name: "playerId" })
  player: User;

  @Column({ type: "uuid" })
  playerId: string;

  @ManyToOne(() => GameThiltape)
  @JoinColumn({ name: "gameThiltapeId" })
  gameThiltape: GameThiltape;

  @Column({ type: "uuid" })
  gameThiltapeId: string;
}
