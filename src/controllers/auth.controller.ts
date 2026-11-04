import type { Request, Response } from "express";
import type { AuthService } from "../services/auth.service";

export function createAuthController(service: AuthService) {
  return {
    async register(req: Request, res: Response) {
      const result = await service.register(req.body);
      res.status(201).json(result);
    },

    async login(req: Request, res: Response) {
      const result = await service.login(req.body);
      res.json(result);
    },

    async refresh(req: Request, res: Response) {
      const result = await service.refresh(req.body.refreshToken);
      res.json(result);
    },

    async logout(req: Request, res: Response) {
      await service.logout(req.body.refreshToken);
      res.status(204).end();
    },

    async me(req: Request, res: Response) {
      const user = await service.getProfile(req.userId!);
      res.json(user);
    },
  };
}