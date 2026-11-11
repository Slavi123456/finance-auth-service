import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../utils/app-error.js";
import type { UserRepo } from "../repositories/user.repository.js";
import type { RefreshTokenRepo } from "../repositories/refresh-token.repository.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";

export interface AuthConfig {
  jwtSecret: string;
  accessTtl: string;
  refreshTtlDays: number;
  bcryptRounds: number;
}

interface Deps {
  users: UserRepo;
  tokens: RefreshTokenRepo;
  config: AuthConfig;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Used when the email is unknown, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

export function createAuthService({ users, tokens, config }: Deps) {
  function toPublicUser(user: { id: string; email: string; name: string }) {
    return { id: user.id, email: user.email, name: user.name };
  }

  function signAccessToken(userId: string, email: string) {
    return jwt.sign({ sub: userId, email }, config.jwtSecret, {
      expiresIn: config.accessTtl as NonNullable<jwt.SignOptions["expiresIn"]>,
    });
  }

  async function createRefreshToken(userId: string) {
    const raw = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + config.refreshTtlDays * 24 * 60 * 60 * 1000);
    const row = await tokens.create({ userId, tokenHash: sha256(raw), expiresAt });
    return { raw, row };
  }

  async function issueSession(user: { id: string; email: string; name: string }) {
    const { raw } = await createRefreshToken(user.id);
    return {
      accessToken: signAccessToken(user.id, user.email),
      refreshToken: raw,
      user: toPublicUser(user),
    };
  }

  return {
    async register(input: RegisterInput) {
      const existing = await users.findByEmail(input.email);
      if (existing) throw new AppError(409, "Email already registered");

      const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
      const user = await users.create({
        email: input.email,
        name: input.name,
        passwordHash,
      });

      if (!user) throw new AppError(500, "Failed to create user");

      return issueSession(user);
    },

    async login(input: LoginInput) {
      const user = await users.findByEmail(input.email);
      const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

      if (!user || !valid) throw new AppError(401, "Invalid email or password");

      return issueSession(user);
    },

    async refresh(rawToken: string) {
      const row = await tokens.findByHash(sha256(rawToken));
      if (!row) throw new AppError(401, "Invalid refresh token");

      // A rotated or logged-out token is being reused. It may have been stolen,
      // so revoke every session for this user.
      if (row.revokedAt) {
        await tokens.revokeAllForUser(row.userId);
        throw new AppError(401, "Refresh token reuse detected, please log in again");
      }

      if (row.expiresAt < new Date()) throw new AppError(401, "Refresh token expired");

      const user = await users.findById(row.userId);
      if (!user) throw new AppError(401, "Invalid refresh token");

      const { raw, row: next } = await createRefreshToken(user.id);
      await tokens.revoke(row.id, next?.id);

      return {
        accessToken: signAccessToken(user.id, user.email),
        refreshToken: raw,
        user: toPublicUser(user),
      };
    },

    async logout(rawToken: string) {
      const row = await tokens.findByHash(sha256(rawToken));
      if (row && !row.revokedAt) await tokens.revoke(row.id);
    },

    async getProfile(userId: string) {
      const user = await users.findById(userId);
      if (!user) throw new AppError(404, "User not found");
      return toPublicUser(user);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
