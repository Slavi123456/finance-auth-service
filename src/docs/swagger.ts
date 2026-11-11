import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/auth.schema.js";

const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["auth"],
  summary: "Register a new user",
  request: { body: { content: { "application/json": { schema: registerSchema } } } },
  responses: {
    201: { description: "User created, tokens returned" },
    400: { description: "Validation failed" },
    409: { description: "Email already registered" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["auth"],
  summary: "Log in with email and password",
  request: { body: { content: { "application/json": { schema: loginSchema } } } },
  responses: {
    200: { description: "Tokens returned" },
    401: { description: "Invalid email or password" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["auth"],
  summary: "Rotate a refresh token and get a new access token",
  request: { body: { content: { "application/json": { schema: refreshSchema } } } },
  responses: {
    200: { description: "New tokens returned" },
    401: { description: "Invalid, expired, or reused refresh token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["auth"],
  summary: "Revoke a refresh token",
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: refreshSchema } } } },
  responses: { 204: { description: "Logged out" } },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["auth"],
  summary: "Get the current user's profile",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: "Profile returned" },
    401: { description: "Missing or invalid access token" },
  },
});

export function mountDocs(app: Express) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Finance Auth Service", version: "1.0.0" },
    // components: {
    //   securitySchemes: {
    //     bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    //   },
    // },
  });

  app.get("/docs.json", (_req, res) => res.json(document));
  if (process.env.NODE_ENV !== "production") {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(document));
  }
}
