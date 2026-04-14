import databaseService from "../database.service";
import { Thiltape } from "../entities/Thiltape.entity";
import { Point } from "typeorm";

/**
 * Converts latitude and longitude to PostGIS Point geometry (WGS84 / SRID 4326)
 */
export function createPoint(longitude: number, latitude: number): Point {
  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
}

/**
 * Extracts latitude from PostGIS Point
 */
export function getLatFromPoint(point: Point): number {
  return point.coordinates[1];
}

/**
 * Extracts longitude from PostGIS Point
 */
export function getLngFromPoint(point: Point): number {
  return point.coordinates[0];
}

/**
 * Creates a global thiltape in the pool (not tied to any game)
 */
export async function createThiltape(data: {
  name: string;
  description?: string;
  imageBase64?: string;
}) {
  const thiltapeRepository = databaseService.getThiltapeRepository();

  const thiltape = new Thiltape();
  thiltape.name = data.name;
  thiltape.description = data.description || null;
  thiltape.imageBase64 = data.imageBase64 || null;

  return thiltapeRepository.save(thiltape);
}

export async function listThiltapes() {
  const thiltapeRepository = databaseService.getThiltapeRepository();
  return thiltapeRepository.find();
}

export async function getThiltape(id: string) {
  const thiltapeRepository = databaseService.getThiltapeRepository();
  return thiltapeRepository.findOneBy({ id });
}
