import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authenticate(requiredRole?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token não fornecido." });
      return;
    }
    try {
      const token = header.split(" ")[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
      };
      req.user = payload;

      // Verifica se a role é necessária
      if (requiredRole && req.user.role !== requiredRole) {
        res.status(403).json({ error: `Acesso restrito a ${requiredRole}.` });
        return;
      }

      next();
    } catch {
      res.status(401).json({ error: "Token inválido." });
    }
  };
}
