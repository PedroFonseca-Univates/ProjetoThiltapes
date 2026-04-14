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
import { User } from "./User.entity";
import { Thiltape } from "./Thiltape.entity";
import { Point } from "typeorm";

@Entity("findings")
@Unique(["player", "thiltape"])
@Index(["player"])
@Index(["thiltape"])
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

  @ManyToOne(() => Thiltape, (thiltape) => thiltape.findings)
  @JoinColumn({ name: "thiltapeId" })
  thiltape: Thiltape;

  @Column({ type: "uuid" })
  thiltapeId: string;
}
