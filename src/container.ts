import { db } from "./db/client";
import { env } from "./config/env";
import { createUserRepository } from "./repositories/user.repository";
import { createRefreshTokenRepository } from "./repositories/refresh-token.repository";
import { createAuthService } from "./services/auth.service";
import { createAuthController } from "./controllers/auth.controller";
import { createAuthRouter } from "./routes/auth.routes";

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