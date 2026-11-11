import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysia/openapi";
import { auth } from "./auth";

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
    openapi({
      provider: "swagger-ui",
      documentation: {
        info: {
          title: "ShelfFlow API",
          version: "0.1.0",
          description: "Supermarket inventory decision-support API",
        },
        tags: [
          { name: "Health", description: "Service health" },
          { name: "Inventory", description: "Batch and risk operations" },
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
  .get("/api/batches", ({ query }) => ({
    storeId: query.storeId,
    items: [],
  }), {
    query: t.Object({
      storeId: t.String(),
    }),
    detail: {
      tags: ["Inventory"],
      summary: "List batches for a store",
    },
  })
  .listen(Number(process.env.PORT ?? 3001));

console.log(`API: http://localhost:${app.server?.port}` );
console.log("Swagger UI: http://localhost:3001/openapi" );
console.log("OpenAPI JSON: http://localhost:3001/openapi/json" );