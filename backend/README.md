# Backend

## Local setup

From the backend directory, install dependencies and create your local environment file:

```powershell
bun install
Copy-Item .env.example .env
```

Generate a secret and replace `BETTER_AUTH_SECRET` in `.env` with its output:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

From the backend directory, start PostgreSQL, apply migrations, and start the API:

```powershell
docker compose -f ..\infra\compose.yaml up -d postgres
bun run db:migrate
bun run dev
```

If you change the Drizzle schema, run `bun run db:generate`, review the migration, then apply it with `bun run db:migrate`.

## Better Auth endpoints

The Elysia server mounts Better Auth at `/api/auth`. Email/password signup and login are enabled.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/sign-up/email` | Create an account |
| `POST` | `/api/auth/sign-in/email` | Sign in |
| `GET` | `/api/auth/get-session` | Read the current session |
| `POST` | `/api/auth/sign-out` | End the current session |

Signup accepts `name`, `email`, and `password`. Login accepts `email` and `password`.
Browser requests must use `credentials: "include"` so the session cookie is stored and sent.
Set `WEB_URL` to the exact frontend origin; the backend uses it for CORS and Better Auth trusted origins.

```ts
const response = await fetch("http://localhost:3001/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "use-a-strong-password",
  }),
});

const result = await response.json();
```

Login uses the same cookie settings and sends only the email and password:

```ts
const response = await fetch("http://localhost:3001/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email: "ada@example.com", password: "use-a-strong-password" }),
});

const result = await response.json();
```
