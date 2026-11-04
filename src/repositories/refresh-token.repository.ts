import { eq, sql } from "drizzle-orm";
import { users } from "../db/schema";
import type { Db } from "../db/client";

export function createUserRepository(db: Db) {
  return {
    async findByEmail(email: string) {
      const [row] = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = lower(${email})`)
        .limit(1);
      return row ?? null;
    },

    async findById(id: string) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ?? null;
    },

    async create(data: { email: string; name: string; passwordHash: string }) {
      const [row] = await db.insert(users).values(data).returning();
      return row;
    },
  };
}

export type UserRepo = ReturnType<typeof createUserRepository>;