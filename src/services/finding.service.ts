import { prisma } from "../../prisma/client";
import { findNearby } from "./thiltape.service";

export async function registerFinding(data: {
  playerId: number;
  thiltapeId: number;
  photo?: string;
  foundLatitude: number;
  foundLongitude: number;
}) {
  const thiltape = await prisma.thiltape.findUnique({
    where: { id: data.thiltapeId },
  });
  if (!thiltape) throw new Error("Thiltape não encontrado.");

  // Verifica se o jogador está perto o suficiente
  const nearby = await findNearby(
    data.foundLatitude,
    data.foundLongitude,
    thiltape.radiusMeters,
  );
  const isNear = nearby.some((t) => t.id === data.thiltapeId);
  if (!isNear)
    throw new Error("Você não está próximo o suficiente do thiltape.");

  // Verifica se já encontrou antes
  const existing = await prisma.finding.findUnique({
    where: {
      playerId_thiltapeId: {
        playerId: data.playerId,
        thiltapeId: data.thiltapeId,
      },
    },
  });
  if (existing) throw new Error("Você já encontrou este thiltape.");

  return prisma.finding.create({ data });
}

export async function listFindings(playerId: number, gameId?: number) {
  return prisma.finding.findMany({
    where: {
      playerId,
      ...(gameId ? { thiltape: { gameId } } : {}),
    },
    include: {
      thiltape: { select: { id: true, name: true, gameId: true } },
    },
    orderBy: { foundAt: "desc" },
  });
}
