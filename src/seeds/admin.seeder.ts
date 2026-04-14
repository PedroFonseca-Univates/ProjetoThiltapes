import bcrypt from "bcryptjs";
import databaseService from "../database.service";
import { User } from "../entities/User.entity";
import { Role } from "../entities/User.entity";

export async function seedAdminUser() {
  const userRepository = databaseService.getUserRepository();

  // Verificar se o admin já existe
  const existingAdmin = await userRepository.findOneBy({ username: "admin" });

  if (existingAdmin) {
    return;
  }

  // Criar novo admin
  const hashedPassword = await bcrypt.hash("admin567", 10);

  const adminUser = new User();
  adminUser.username = "admin";
  adminUser.password = hashedPassword;
  adminUser.role = Role.ADMIN;

  await userRepository.save(adminUser);
}
