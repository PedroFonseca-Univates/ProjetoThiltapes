import "dotenv/config";
import { AppDataSource } from "../database";
import { runUserSeed } from "./user.seeder";

async function runSeeds() {
  try {
    // Inicializa a conexão com o banco de dados
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("[Seeder] Conectado ao banco de dados.");
    }

    console.log("[Seeder] Executando seeders...");

    // Executar seeds
    await runUserSeed();

    console.log("[Seeder] Seeders executados com sucesso.");
  } catch (error) {
    console.error("[Seeder] Erro ao executar seeders: ", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runSeeds();
