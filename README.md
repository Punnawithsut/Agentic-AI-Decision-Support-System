# ShelfFlow

## Agentic AI Decision Support System for Supermarket Inventory Risk

ShelfFlow is a final-year-project prototype for an Agentic AI Decision Support System that helps supermarket managers investigate expiry-risk inventory decisions. It is not a replacement for a POS, ERP or warehouse-management system.

The manager asks a natural-language question. The agent decomposes the request, selects approved tools, retrieves scoped data and uses deterministic backend services to calculate results. It then explains the evidence and prepares a recommendation. The manager remains responsible for approving operational actions.

The project’s primary workflow is **expiry-risk investigation**. The Store Heatmap Planner is a supporting case-study tool that demonstrates what-if product-placement simulation through the same agentic harness. In this README, “harness” describes the internal orchestration and safety architecture; the official project name remains **Agentic AI Decision Support System**.

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

## Project status and scope

This is a local-first MVP and academic research prototype. It accepts structured CSV exports for:

- Products and stores
- Batch stock and expiry dates
- Daily sales history
- Store layout positions

The MVP focuses on:

- Batch-level expiry-risk analysis
- Short-horizon demand estimation
- Explainable recommendations
- Agent task and tool execution records
- Manager approval and audit logging
- A configurable 2D heatmap for layout simulation

It does not include live POS integration, automatic purchasing, automatic disposal, automatic stock transfer, 3D store reconstruction, computer vision, supplier negotiation or warehouse optimization.

## Technology stack

### Application

- Next.js, React, TypeScript and Tailwind CSS
- Bun runtime and package manager
- Elysia API framework
- Zod or Elysia TypeBox for validation
- Drizzle ORM
- PostgreSQL with Docker Compose

### Agent layer

- Provider-independent `AgentProvider` interface
- `OpenCodeAgentProvider` for local development and evaluation
- A currently available free OpenCode model when possible
- `MockAgentProvider` for deterministic tests and fallback
- Optional future AWS provider

The model selects tools, but the backend validates permissions and executes TypeScript tool adapters. Deterministic services perform expiry, demand, transfer-candidate and layout calculations.

### Optional AWS mode

AWS is a later migration or demonstration target, not a requirement for completing the MVP. Possible services include Cognito, API Gateway, Lambda, S3, RDS PostgreSQL, CloudWatch, Bedrock and AgentCore. Bedrock and AgentCore usage is not assumed to be free; the local mode must remain usable without paid cloud services.

## Architecture

```text
Next.js web app
       ↓
Bun + Elysia API
       ↓
Agent orchestrator
 ├── conversation and run state
 ├── tool registry
 ├── authorization
 └── audit logging
       ↓
Controlled TypeScript tools
       ↓
Business services and deterministic domain rules
       ↓
Repositories
       ↓
PostgreSQL
```

A tool call follows this boundary:

```text
agent tool → service → repository → database
```

The same tool contracts and business rules should work with the local provider, mock provider or optional AWS provider.

## Repository strategy: monorepo

Use one repository with separate frontend, backend and shared packages:

```text
shelfflow/
├── apps/web/        # Next.js frontend
├── apps/api/        # Bun + Elysia backend
├── packages/db/     # Drizzle schema and migrations
├── packages/shared/ # Shared types and validation
├── packages/agent/  # Providers, prompts, tool contracts and traces
├── scripts/         # Seed, import and evaluation scripts
├── fixtures/        # Demo CSV files and evaluation cases
├── infra/           # Docker and optional AWS files
└── docs/            # Architecture, tools and evaluation notes
```

A monorepo keeps shared TypeScript types close to both applications and allows one change to update the API and frontend together.

## Backend structure

```text
apps/api/src/
├── server.ts
├── routes/       # HTTP endpoints only
├── services/     # Use cases, authorization and orchestration
├── repo/         # Database queries only
├── domain/       # Deterministic calculations and business rules
├── tools/        # Agent-facing adapters returning structured JSON
├── middleware/   # Authentication and error handling
└── tests/
```

Dependency direction:

```text
routes → services → repo → database
              ↓
           domain rules

agent tool → service
```

Routes should not contain SQL or complex business logic. Repositories should not decide whether a recommendation may be approved. Tools should not access the database directly.

## Core tools

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

Every tool must define a name, description, input schema, output schema and permission level. The backend must validate the authenticated user, organization scope, store scope and arguments before execution.

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

- Directories: lowercase kebab-case or consistent lowercase collection names
- TypeScript files: `recommendation.service.ts`, `batch.repo.ts`, `simulate-product-placement.tool.ts`
- React components: PascalCase, such as `StoreHeatmap.tsx`
- Functions and variables: `camelCase`
- Types and classes: `PascalCase`
- PostgreSQL identifiers: lowercase `snake_case`, plural tables and `<entity>_id` foreign keys
- API paths: plural lowercase resources, such as `/recommendations` and `/expiry-risks`
- Environment variables: `UPPER_SNAKE_CASE`
- Branches: `feat/csv-import`, `fix/expiry-risk-calculation`

Use one domain name consistently across layers:

```text
routes/recommendation.routes.ts
services/recommendation.service.ts
repo/recommendation.repo.ts
domain/recommendation-rules.ts
tools/create-recommendation.tool.ts
```

## Local setup

### Prerequisites

Install Git, Bun, Docker and OpenCode if available. A mock agent can be used when a free model is unavailable.

```bash
git clone <repository-url>
cd shelfflow
bun install
cp .env.example .env
docker compose up -d postgres
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev:api
bun run dev:web
```

Open `http://localhost:3000`.

Example local environment:

```env
NODE_ENV=development
DATABASE_URL=postgresql://shelfflow:shelfflow@localhost:5432/shelfflow
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
AGENT_PROVIDER=mock
CSV_STORAGE_PATH=./local-data/imports
```

Keep the exact commands synchronized with `package.json`. Never commit `.env`, passwords, AWS keys or model API keys.

## Security and audit rules

- Scope every query by organization and store.
- Never trust an organization or store ID supplied by the model.
- Validate all tool arguments on the server.
- Separate read-only, analysis, draft and state-changing tools.
- Require explicit manager approval for operational actions.
- Store tool calls, evidence IDs, recommendation status and approval decisions.
- Treat `recommendation_draft`, `approval_recorded` and `action_executed` as different states.
- Do not store production personal data in the student demo.

The model may explain system state, but only the backend may create system state.

## Testing and evaluation

Test deterministic domain functions for expiry days, demand estimates, surplus, risk classification, transfer candidates, shelf capacity, storage compatibility and heatmap indicators.

Test agent behavior with scripted manager questions. Verify:

- Correct tool selection and parameters
- Correct evidence use
- No invented quantities or dates
- Correct handling of missing data
- Approval before state changes
- Resumable agent runs and accurate completion status

Compare a manual or rule-based workflow with the Agentic AI workflow using task time, risk accuracy, explanation grounding, tool-call success, unsupported claims, unauthorized actions and user confidence.

## Development roadmap

1. Confirm the research question and evaluation dataset.
2. Build local database, organization scope and CSV import.
3. Implement batch, demand and expiry-risk services.
4. Build the dashboard and audit records.
5. Implement the provider-independent agent and approved tools.
6. Add recommendation, approval and resumable run state.
7. Add the heatmap and layout simulation as the supporting case study.
8. Evaluate the manual baseline against the agentic workflow.
9. Migrate selected components to AWS only if credits or funding are available.

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
