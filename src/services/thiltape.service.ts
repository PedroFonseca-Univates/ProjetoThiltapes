import { prisma } from "../../prisma/client";

export async function createThiltape(data: {
  name: string;
  description?: string;
  image?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  gameId: number;
}) {
  return prisma.thiltape.create({ data });
}

export async function listByGame(gameId: number) {
  return prisma.thiltape.findMany({
    where: { gameId },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      createdAt: true,
    },
  });
}

export async function getThiltape(id: number) {
  return prisma.thiltape.findUnique({ where: { id } });
}

// Retorna thiltapes dentro de um raio (em metros) usando cálculo Haversine
export async function findNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
  gameId?: number,
) {
  // Usamos SQL raw para aproveitar PostGIS se disponível, com fallback puro
  const thiltapes = await prisma.thiltape.findMany({
    where: gameId ? { gameId } : undefined,
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      gameId: true,
    },
  });

  // Filtro Haversine em JS (fallback sem PostGIS)
  return thiltapes.filter((t) => {
    const dist = haversine(lat, lng, t.latitude, t.longitude);
    return dist <= radiusMeters;
  });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
