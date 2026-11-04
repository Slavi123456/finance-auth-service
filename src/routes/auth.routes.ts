import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/auth.schema";
import type { AuthController } from "../controllers/auth.controller";

export function createAuthRouter(controller: AuthController) {
  const router = Router();

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", validate(loginSchema), controller.login);
  router.post("/refresh", validate(refreshSchema), controller.refresh);
  router.post("/logout", validate(refreshSchema), controller.logout);
  router.get("/me", authenticate, controller.me);

  return router;
}