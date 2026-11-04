import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://auth:auth@localhost:5433/auth_test",
      JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
      BCRYPT_ROUNDS: "4",
    },
  },
});