import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/auth.schema.js";
import type { AuthController } from "../controllers/auth.controller.js";

export const createAuthRouter = function (controller: AuthController) {
  const router = Router();

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", validate(loginSchema), controller.login);
  router.post("/refresh", validate(refreshSchema), controller.refresh);
  router.post("/logout", validate(refreshSchema), controller.logout);
  router.get("/me", authenticate, controller.me);

  return router;
};
