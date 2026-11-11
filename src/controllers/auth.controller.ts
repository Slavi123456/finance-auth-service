import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { AuthService } from "../services/auth.service.js";
import type { LoginInput, RefreshTokenInput, RegisterInput } from "../schemas/auth.schema.js";

type ValidatedRequest<B> = Request<ParamsDictionary, unknown, B>;

export function createAuthController(service: AuthService) {
  return {
    register: async (req: ValidatedRequest<RegisterInput>, res: Response) => {
      const result = await service.register(req.body);
      res.status(201).json(result);
    },

    login: async (req: ValidatedRequest<LoginInput>, res: Response) => {
      const result = await service.login(req.body);
      res.json(result);
    },

    refresh: async (req: ValidatedRequest<RefreshTokenInput>, res: Response) => {
      const result = await service.refresh(req.body.refreshToken);
      res.json(result);
    },

    logout: async (req: ValidatedRequest<RefreshTokenInput>, res: Response) => {
      await service.logout(req.body.refreshToken);
      res.status(204).end();
    },

    me: async (req: Request, res: Response) => {
      const user = await service.getProfile(req.userId!);
      res.json(user);
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
