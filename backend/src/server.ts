import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./lib/auth";

const port = Number(process.env.PORT ?? 3001);

const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_URL ?? "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "ShelfFlow API",
          version: "0.1.0",
          description: "Supermarket inventory decision-support API",
        },
        tags: [
          { name: "Health", description: "Service health" },
        ],
      },
    }),
  )
  .mount(auth.handler)
  .get("/health", () => ({ ok: true }), {
    detail: {
      tags: ["Health"],
      summary: "Check API health",
    },
  })
  .listen(port);

console.log(`API: http://localhost:${app.server?.port}`);
console.log(`Swagger UI: http://localhost:${port}/swagger`);
console.log(`OpenAPI JSON: http://localhost:${port}/swagger/json`);