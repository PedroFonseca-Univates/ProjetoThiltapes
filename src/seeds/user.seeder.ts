import bcrypt from "bcryptjs";
import databaseService from "../database.service";
import { User } from "../entities/User.entity";
import { Role } from "../entities/User.entity";

export async function runUserSeed() {
  const userRepository = databaseService.getUserRepository();

  // Verificar se o admin já existe
  const existingAdmin = await userRepository.findOneBy({ username: "admin" });

  if (existingAdmin) {
    return;
  }

  // Criar novo admin
  var hashedPassword = await bcrypt.hash("admin567", 10);

  const adminUser = new User();
  adminUser.username = "admin";
  adminUser.password = hashedPassword;
  adminUser.role = Role.ADMIN;

  await userRepository.save(adminUser);

  // Verificar se o player já existe
  const existingPlayer = await userRepository.findOneBy({ username: "player" });

  if (existingPlayer) {
    return;
  }

  // Criar novo player
  var hashedPassword = await bcrypt.hash("player123", 10);

  const playerUser = new User();
  playerUser.username = "player";
  playerUser.password = hashedPassword;
  playerUser.role = Role.PLAYER;

  await userRepository.save(playerUser);
}
