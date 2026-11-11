# ShelfFlow

## Agentic AI Decision Support System for Supermarket Inventory Risk

ShelfFlow is a final-year-project prototype for an Agentic AI Decision Support System that helps supermarket managers investigate expiry-risk inventory decisions. It is not a replacement for a POS, ERP or warehouse-management system.

The manager asks a natural-language question. The agent decomposes the request, selects approved tools, retrieves scoped data and uses deterministic backend services to calculate results. It explains the evidence and prepares a recommendation. The manager remains responsible for approving operational actions.

The primary workflow is **expiry-risk investigation**. The Store Heatmap Planner is a supporting case-study tool that demonstrates what-if product-placement simulation through the same agentic harness. “Harness” describes the internal orchestration and safety architecture; the official project name remains **Agentic AI Decision Support System**.

```text
Manager question
      ↓
Agent planning and task decomposition
      ↓
Approved tool selection
      ↓
Backend validation and deterministic calculation
      ↓
Evidence-backed recommendation
      ↓
Manager approval and audit record
```

The agent never receives direct database credentials, unrestricted SQL access or a generic “execute anything” tool.

## Project scope

The local-first MVP accepts structured CSV exports for products, stores, batches, sales history and store layout positions. It focuses on batch-level expiry-risk analysis, demand estimation, explainable recommendations, approval records, audit logging and a configurable 2D heatmap for layout simulation.

It does not include live POS integration, automatic purchasing, automatic disposal, automatic stock transfer, 3D store reconstruction, computer vision, supplier negotiation or warehouse optimization.

## Technology stack

- **Frontend:** Next.js, React, TypeScript and Tailwind CSS
- **Backend:** Bun, Elysia, TypeScript and Zod or Elysia TypeBox
- **Authentication:** Better Auth
- **Database:** PostgreSQL with Docker
- **ORM and migrations:** Drizzle ORM and Drizzle Kit
- **API documentation:** Elysia OpenAPI with Swagger UI
- **Agent providers:** OpenCode provider, deterministic mock provider and optional future AWS provider

The model selects tools, but the backend validates permissions and executes TypeScript tool adapters. Deterministic services perform expiry, demand, transfer-candidate and layout calculations.

## Project structure

Use one repository with a clearly separated frontend and backend:

```text
Agentic-AI-Decision-Support-System/
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── (auth)/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── assistant/
│   │   ├── inventory/
│   │   ├── recommendations/
│   │   └── stores/
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── backend/                  # Bun + Elysia API
│   ├── src/
│   │   ├── server.ts
│   │   ├── auth.ts
│   │   ├── db/
│   │   ├── schema/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repo/
│   │   ├── domain/
│   │   ├── tools/
│   │   ├── middleware/
│   │   └── tests/
│   ├── drizzle.config.ts
│   └── package.json
│
├── infra/
│   └── compose.yaml           # Local PostgreSQL
├── scripts/
├── fixtures/
├── docs/
├── package.json
├── .env.example
└── README.md
```

## Backend layering

```text
routes → services → repo → database
              ↓
           domain rules

agent tool → service
```

- `routes/` defines HTTP endpoints and validates requests.
- `services/` contains use cases, authorization and orchestration.
- `repo/` contains database queries only.
- `domain/` contains deterministic calculations and business rules.
- `tools/` adapts agent tool calls to backend services.
- `middleware/` contains authentication and error handling.

Routes should not contain SQL or complex business logic. Tools should not access the database directly.

## Core agent tools

```text
get-store-summary
get-expiry-risks
get-batch-detail
calculate-demand-estimate
find-transfer-candidates
simulate-product-placement
create-recommendation-draft
record-manager-decision
```

Every tool must define a name, description, input schema, output schema and permission level. The backend validates the authenticated user, organization scope, store scope and arguments before execution.

## Data model

```text
users
organizations
organization_members
stores
store_locations
products
batches
inventory_transactions
sales_records
risk_results
recommendations
layout_versions
product_positions
approval_records
import_jobs
import_errors
audit_logs
```

Important relationships:

```text
organization → stores → locations
organization → products → batches
store + product + date → sales records
batch + demand estimate → risk result
risk result → recommendation → approval record
store + layout version → product positions
```

## Naming conventions

- Directories: lowercase names, such as `routes/`, `services/` and `store-layout/`
- TypeScript files: `recommendation.service.ts`, `batch.repo.ts`, `simulate-product-placement.tool.ts`
- React components: PascalCase, such as `StoreHeatmap.tsx`
- Functions and variables: `camelCase`
- Types and classes: `PascalCase`
- PostgreSQL identifiers: lowercase `snake_case`, plural tables and `<entity>_id` foreign keys
- API paths: plural lowercase resources, such as `/recommendations` and `/expiry-risks`
- Environment variables: `UPPER_SNAKE_CASE`
- Branches: `feat/csv-import` and `fix/expiry-risk-calculation`

Use the same domain name across layers:

```text
routes/recommendation.routes.ts
services/recommendation.service.ts
repo/recommendation.repo.ts
domain/recommendation-rules.ts
tools/create-recommendation.tool.ts
```

## Security and audit rules

- Scope every query by organization and store.
- Never trust an organization or store ID supplied by the model.
- Validate all tool arguments on the server.
- Separate read-only, analysis, draft and state-changing tools.
- Require explicit manager approval for operational actions.
- Store tool calls, evidence IDs, recommendation status and approval decisions.
- Treat draft, approval and execution as separate states.
- Do not store production personal data in the student demo.

The model may explain system state, but only the backend may create system state.

## Testing and evaluation

Test deterministic functions for expiry days, demand estimates, surplus, risk classification, transfer candidates, shelf capacity, storage compatibility and heatmap indicators.

Test agent behavior with scripted questions. Verify tool selection, parameters, evidence use, missing-data handling and approval before state changes. Compare a manual or rule-based workflow with the Agentic AI workflow using task time, risk accuracy, explanation grounding, unsupported claims, tool-call success, unauthorized actions and user confidence.

## Local development

The full setup is documented in [`docs/local-stack-setup.md`](docs/local-stack-setup.md). The short version is:

```bash
docker compose -f infra/compose.yaml up -d
bun install
bun run dev
```

The local system should work without paid AWS AI services. OpenCode can be used when an available free model is suitable; a mock provider is required for repeatable tests and fallback.

## Known limitations

- CSV data may not represent every supermarket system.
- Synthetic data cannot prove real-world waste reduction.
- Short or incomplete sales history can make demand estimates inaccurate.
- Heatmap associations do not prove that a shelf position causes sales changes.
- Agent responses require evaluation and may contain errors.
- ShelfFlow supports decisions; it does not replace food-safety policy or manager judgment.

## License and contact

Choose a license before publishing the repository. For a private academic project, keep the repository private until the supervisor and project team agree on sharing.

```text
Project owner: <your-name>
Institution: <your-university>
Supervisor: <supervisor-name>
Repository: <repository-url>
```
