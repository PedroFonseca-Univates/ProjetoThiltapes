import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../auth.middleware";
import {
  createThiltape,
  listThiltapes,
  getThiltape,
} from "../services/thiltape.service";

const router = Router();

// Buscar thiltape por ID (admin vê imagem, player não)
router.get("/:id", authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const t = await getThiltape(req.params.id);
    if (!t) {
      res.status(404).json({ error: "Thiltape não encontrado." });
      return;
    }
    if (req.user?.role !== "ADMIN") {
      const { imageBase64, ...rest } = t;
      res.json(rest);
      return;
    }
    res.json(t);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Listar todos os thiltapes públicos do pool global
router.get("/", authenticate(), async (req: AuthRequest, res: Response) => {
  try {
    const thiltapes = await listThiltapes();
    res.json(thiltapes);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Criar thiltape no pool global (admin)
router.post(
  "/",
  authenticate("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    const { name, description, imageBase64 } = req.body;

    if (!name) {
      res.status(400).json({
        error: "name é obrigatório.",
      });
      return;
    }

    try {
      const t = await createThiltape({
        name,
        description,
        imageBase64,
      });
      res.status(201).json(t);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  },
);

export default router;
