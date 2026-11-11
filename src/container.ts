import { db } from "./db/client.js";
import { env } from "./config/env.js";
import { createUserRepository } from "./repositories/user.repository.js";
import { createRefreshTokenRepository } from "./repositories/refresh-token.repository.js";
import { createAuthService } from "./services/auth.service.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { createAuthRouter } from "./routes/auth.routes.js";

const users = createUserRepository(db);
const tokens = createRefreshTokenRepository(db);

const authService = createAuthService({
  users,
  tokens,
  config: {
    jwtSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.ACCESS_TOKEN_TTL,
    refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    bcryptRounds: env.BCRYPT_ROUNDS,
  },
});

export const authRouter = createAuthRouter(createAuthController(authService));
