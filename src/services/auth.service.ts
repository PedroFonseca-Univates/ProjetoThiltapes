import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import databaseService from "../database.service";
import { User } from "../entities/User.entity";

export async function register(username: string, password: string) {
  const userRepository = databaseService.getUserRepository();

  const existing = await userRepository.findOneBy({ username });

  if (existing) throw new Error("Usuário já cadastrado.");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User();
  user.username = username;
  user.password = hashedPassword;

  const savedUser = await userRepository.save(user);

  const token = jwt.sign(
    { id: savedUser.id, role: savedUser.role },
    process.env.JWT_SECRET!,
    { expiresIn: "999d" },
  );

  return {
    token,
    user: { id: savedUser.id, name: savedUser.username, role: savedUser.role },
  };
}

export async function login(username: string, password: string) {
  const userRepository = databaseService.getUserRepository();

  const user = await userRepository.findOneBy({ username });

  if (!user) throw new Error("Credenciais inválidas.");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new Error("Credenciais inválidas.");

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "999d" },
  );

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}
