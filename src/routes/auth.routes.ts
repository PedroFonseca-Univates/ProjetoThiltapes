import { Router, Request, Response } from "express";
import { register, login } from "../services/auth.service";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username e password são obrigatórios." });
    return;
  }
  try {
    const user = await register(username, password);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "username e password são obrigatórios." });
    return;
  }
  try {
    const result = await login(username, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

export default router;
