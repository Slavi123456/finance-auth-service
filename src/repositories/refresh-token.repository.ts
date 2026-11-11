import { and, eq, isNull } from "drizzle-orm";
import { refreshTokens } from "../db/schema.js";
import type { Db } from "../db/client.js";

export function createRefreshTokenRepository(db: Db) {
  return {
    async create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
      const [row] = await db.insert(refreshTokens).values(data).returning();
      return row;
    },

    async findByHash(tokenHash: string) {
      const [row] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1);
      return row ?? null;
    },

    async revoke(id: string, replacedById?: string) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date(), replacedById: replacedById ?? null })
        .where(eq(refreshTokens.id, id));
    },

    async revokeAllForUser(userId: string) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    },
  };
}

export type RefreshTokenRepo = ReturnType<typeof createRefreshTokenRepository>;
