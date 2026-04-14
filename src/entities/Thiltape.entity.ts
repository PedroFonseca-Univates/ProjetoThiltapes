import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Finding } from "./Finding.entity";
import { GameThiltape } from "./GameThiltape.entity";

@Entity("thiltapes")
export class Thiltape {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "text", nullable: true })
  imageBase64: string | null;

  // Relations
  @OneToMany(() => Finding, (finding) => finding.thiltape, { cascade: true })
  findings: Finding[];

  @OneToMany(() => GameThiltape, (gt) => gt.thiltape, { cascade: true })
  gameThiltapes: GameThiltape[];
}
