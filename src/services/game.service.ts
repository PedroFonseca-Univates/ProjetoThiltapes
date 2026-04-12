import { prisma } from "../../prisma/client";

export async function createGame(data: {
  name: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  createdBy: number;
}) {
  return prisma.game.create({
    data: {
      name: data.name,
      description: data.description,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      createdBy: data.createdBy,
    },
  });
}

export async function listGames(onlyActive = false) {
  return prisma.game.findMany({
    where: onlyActive ? { active: true } : undefined,
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { thiltapes: true, gamePlayers: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGame(id: number) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      thiltapes: {
        select: {
          id: true,
          name: true,
          description: true,
          latitude: true,
          longitude: true,
          radiusMeters: true,
        },
      },
      _count: { select: { gamePlayers: true } },
    },
  });
}

export async function joinGame(gameId: number, playerId: number) {
  return prisma.gamePlayer.create({ data: { gameId, playerId } });
}

export async function toggleGame(id: number, active: boolean) {
  return prisma.game.update({ where: { id }, data: { active } });
}
