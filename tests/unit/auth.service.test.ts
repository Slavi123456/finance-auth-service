import { describe, it, expect, beforeEach } from "vitest";
import { createAuthService } from "../../src/services/auth.service.js";
// import type { UserRepo } from "../../src/repositories/user.repository.js";
// import type { RefreshTokenRepo } from "../../src/repositories/refresh-token.repository.js";

function fakeRepos() {
  const userRows: any[] = [];
  const tokenRows: any[] = [];

  const users = {
    findByEmail: async (email: string) =>
      userRows.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
    findById: async (id: string) => userRows.find((u) => u.id === id) ?? null,
    create: async (data: any) => {
      const row = { id: crypto.randomUUID(), ...data };
      userRows.push(row);
      return row;
    },
  };

  const tokens = {
    create: async (data: any) => {
      const row = { id: crypto.randomUUID(), revokedAt: null, replacedById: null, ...data };
      tokenRows.push(row);
      return row;
    },
    findByHash: async (hash: string) => tokenRows.find((t) => t.tokenHash === hash) ?? null,
    revoke: async (id: string, replacedById?: string) => {
      const row = tokenRows.find((t) => t.id === id);
      if (row) {
        row.revokedAt = new Date();
        row.replacedById = replacedById ?? null;
      }
    },
    revokeAllForUser: async (userId: string) => {
      tokenRows.filter((t) => t.userId === userId).forEach((t) => (t.revokedAt = new Date()));
    },
  };

  return { users, tokens };
}

const config = {
  jwtSecret: "test-secret-that-is-at-least-32-characters-long",
  accessTtl: "15m",
  refreshTtlDays: 30,
  bcryptRounds: 4,
};

describe("auth service", () => {
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    const { users, tokens } = fakeRepos();
    service = createAuthService({ users, tokens, config });
  });

  it("registers a user and returns tokens", async () => {
    const result = await service.register({
      email: "a@example.com",
      name: "Alice",
      password: "password123",
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).toMatchObject({ email: "a@example.com", name: "Alice" });
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email with 409", async () => {
    const input = { email: "a@example.com", name: "Alice", password: "password123" };
    await service.register(input);
    await expect(service.register(input)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a wrong password with 401", async () => {
    await service.register({ email: "a@example.com", name: "Alice", password: "password123" });
    await expect(
      service.login({ email: "a@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rotates refresh tokens and rejects the old one", async () => {
    const { refreshToken } = await service.register({
      email: "a@example.com",
      name: "Alice",
      password: "password123",
    });

    const rotated = await service.refresh(refreshToken);
    expect(rotated.refreshToken).not.toBe(refreshToken);

    // Reusing the old token should fail and revoke the session
    await expect(service.refresh(refreshToken)).rejects.toMatchObject({ status: 401 });
  });
});
