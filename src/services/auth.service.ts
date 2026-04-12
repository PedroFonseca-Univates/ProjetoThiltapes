import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client";

export async function register(username: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) throw new Error("Usuário já cadastrado.");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password: hashedPassword },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "999d" },
  );

  return {
    token,
    user: { id: user.id, name: user.username, role: user.role },
  };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

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
    user: { id: user.id, name: user.username, role: user.role },
  };
}
