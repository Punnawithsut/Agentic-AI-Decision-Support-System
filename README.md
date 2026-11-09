# ShelfFlow

## Local-First Agentic AI Decision Support System for Supermarket Inventory Risk

ShelfFlow is a final-year-project prototype that upgrades an existing supermarket stock workflow with Agentic AI decision support.

Managers import existing product, batch, sales and store-layout data. ShelfFlow calculates expiry risk, identifies important inventory issues and uses an agent to produce evidence-backed recommendations. Managers remain responsible for approving operational actions.

The first version is designed to run locally at no service cost. The architecture is AWS-compatible so selected components can be migrated to AWS later if student credits, university funding or an approved AWS account are available.

## Project status

This project is an MVP and academic research prototype. It is not a production supermarket ERP, POS or warehouse-management system.

The current MVP focuses on:

- CSV-based data import
- Batch-level stock and expiry tracking
- Expiry-risk analysis
- Dashboard summaries
- Explainable recommendations
- Notifications
- 2D Store Heatmap Planner
- Manager approval and audit records

## Main objectives

ShelfFlow aims to investigate whether an Agentic AI interface can help a supermarket manager:

1. Identify batches that may expire before they sell.
2. Understand why a batch is considered risky.
3. Compare possible actions such as transfer, discount review or reorder.
4. Find related stock and demand information through natural-language questions.
5. Simulate a product-placement change on a simple store layout.
6. Approve or reject a recommendation safely.

The system does not automatically execute irreversible actions such as disposal, purchasing or stock transfer.

## Technology stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React
- React Hook Form or equivalent form library
- React Flow, SVG or Canvas for the 2D store layout
- Recharts or Apache ECharts for dashboard visualizations

### Local backend

- Bun runtime and package manager
- Elysia API framework
- TypeScript
- Zod or Elysia TypeBox for validation
- Drizzle ORM
- PostgreSQL running with Docker Compose

### Zero-cost Agentic AI mode

- Provider-independent `AgentProvider` interface
- `OpenCodeAgentProvider` for development and evaluation
- GLM-5.3-Flash Free through OpenCode when the current free offering is available
- `MockAgentProvider` for deterministic tests and fallback
- Optional local model provider when local inference is available
- Deterministic mock agent for development, testing and fallback
- Tool functions for expiry analysis, recommendations and layout simulation

The agent should call controlled tools instead of receiving direct database access.

### Optional AWS mode

AWS is an optional migration and demonstration target, not a required dependency for completing the MVP.

- Amazon Cognito for authentication
- AWS Amplify Hosting or another AWS hosting option for the frontend
- Amazon API Gateway for API access
- AWS Lambda for backend functions and agent tools
- Amazon S3 for CSV files and exports
- Amazon RDS for PostgreSQL for the cloud database
- Amazon EventBridge Scheduler for scheduled risk checks
- Amazon CloudWatch for logging and monitoring
- Amazon Bedrock for model inference
- Amazon Bedrock AgentCore Runtime for hosting the agent
- Amazon Bedrock AgentCore Gateway for exposing approved tools

Bedrock and AgentCore use usage-based pricing. The local mode should remain available so the project can be developed and evaluated without depending on paid AWS AI services.

## Local-first architecture

```text
                    Local development mode

[Next.js web app]
        |
        v
[Bun + Elysia API]
        |
        +----------------------+
        |                      |
        v                      v
[PostgreSQL]       [OpenCodeAgentProvider]
        |                      |
        +----------+-----------+
                   |
                   v
          [Controlled tool functions]
                   |
                   +--> Expiry-risk analysis
                   +--> Demand estimate
                   +--> Recommendation draft
                   +--> Transfer candidates
                   +--> Layout simulation
                   +--> Approval and audit
```

### Optional AWS migration

```text
[Next.js]
    |
    v
[API Gateway] --> [Lambda services] --> [RDS PostgreSQL]
                         |
                         +--> [S3 CSV files]
                         +--> [CloudWatch]

[AgentCore Runtime]
    |
    v
[AgentCore Gateway] --> [Approved Lambda tools]
    |
    v
[Amazon Bedrock model]
```

The business rules and tool contracts should stay the same in both modes.

## Repository strategy: use a monorepo

Use **one Git repository containing separate frontend and backend applications**. This is a monorepo. It is not one large directory where frontend and backend files are mixed together.

```text
one Git repository: shelfflow/
├── apps/web/        # frontend application
├── apps/api/        # backend application
└── packages/        # shared code
```

This structure is recommended for the FYP because:

- Frontend and backend can be developed and tested separately.
- Shared TypeScript types and validation schemas can be reused.
- One pull request can update an API route and its frontend client together.
- Local development remains simple because the project uses one repository and one issue tracker.
- The backend can later be deployed to AWS Lambda/API Gateway without restructuring the frontend.

Do not create two unrelated repositories at the beginning. Separate repositories add coordination work and make shared types harder to maintain. Split into separate repositories only if the project later becomes a production platform with independent teams and release cycles.

### Backend layering

The backend should follow this dependency direction:

```text
routes/  →  services/  →  repo/  →  database
   ↓           ↓
validation   domain rules
```

#### `routes/`

Routes define HTTP endpoints. They should parse and validate the request, call the appropriate service and convert the service result into an HTTP response.

Routes should not contain SQL, complex calculations or business decisions.

```ts
// routes/recommendation.routes.ts
app.get('/recommendations', async ({ query, user }) => {
  const input = listRecommendationsSchema.parse(query)
  return recommendationService.list(user.organizationId, input)
})
```

#### `services/`

Services contain business logic and use cases. They coordinate repositories, domain calculations, authorization checks and audit events.

```ts
// services/recommendation.service.ts
export async function list(organizationId: string, input: ListInput) {
  const rows = await recommendationRepo.findMany(organizationId, input)
  return rows.map(toRecommendationDto)
}
```

Services should not depend on HTTP-specific objects such as Elysia request contexts.

#### `repo/`

The repository layer handles database queries. It should be the only backend layer that directly imports Drizzle query functions for application data access.

```ts
// repo/recommendation.repo.ts
export function findMany(organizationId: string, input: ListInput) {
  return db.query.recommendations.findMany({
    where: and(
      eq(recommendations.organizationId, organizationId),
      eq(recommendations.status, input.status),
    ),
  })
}
```

Repositories should not decide whether a recommendation is valid or whether a manager may approve it. Those decisions belong in services or domain functions.

#### `domain/`

Domain functions contain deterministic calculations that can be tested without a database or HTTP server:

- `calculateExpiryRisk()`
- `calculateDemandEstimate()`
- `calculateEstimatedSurplus()`
- `findTransferCandidates()`
- `validatePlacement()`
- `calculateHeatmapIndicators()`

#### `tools/`

Agent tools are adapters around services. They validate agent parameters, call services and return structured JSON. They must not contain unrestricted database access.

```text
agent tool → service → repo → database
```

### Recommended backend structure

```text
apps/api/src/
├── server.ts
├── routes/
│   ├── auth.routes.ts
│   ├── import.routes.ts
│   ├── batch.routes.ts
│   ├── dashboard.routes.ts
│   ├── recommendation.routes.ts
│   └── heatmap.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── import.service.ts
│   ├── batch.service.ts
│   ├── dashboard.service.ts
│   ├── recommendation.service.ts
│   ├── notification.service.ts
│   └── heatmap.service.ts
├── repo/
│   ├── user.repo.ts
│   ├── organization.repo.ts
│   ├── product.repo.ts
│   ├── batch.repo.ts
│   ├── sales.repo.ts
│   ├── recommendation.repo.ts
│   ├── notification.repo.ts
│   └── layout.repo.ts
├── domain/
│   ├── expiry-risk.ts
│   ├── demand-estimate.ts
│   ├── transfer-rules.ts
│   └── heatmap-indicators.ts
├── tools/
│   ├── get-expiry-risks.tool.ts
│   ├── calculate-demand.tool.ts
│   ├── find-transfer-candidates.tool.ts
│   └── simulate-placement.tool.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
└── tests/
```

## Project structure

```text
shelfflow/
├── apps/
│   ├── web/                              # Next.js frontend
│   │   ├── app/                          # App Router pages and layouts
│   │   │   ├── (auth)/                   # Sign-in and authentication pages
│   │   │   ├── dashboard/                # Main dashboard
│   │   │   ├── imports/                  # CSV upload and validation
│   │   │   ├── batches/                  # Batch list and detail pages
│   │   │   ├── recommendations/          # Recommendation review
│   │   │   ├── heatmap/                  # Store Heatmap Planner
│   │   │   ├── reports/                  # Reports and exports
│   │   │   └── settings/                 # Organization and store settings
│   │   ├── components/                   # Frontend components
│   │   ├── lib/                          # API client and frontend utilities
│   │   ├── hooks/                        # React hooks
│   │   └── styles/                       # Global styles
│   │
│   └── api/                              # Bun + Elysia API
│       ├── src/
│       │   ├── server.ts                 # API entry point
│       │   ├── routes/                   # HTTP route definitions
│       │   ├── services/                 # Application services
│       │   ├── repo/                     # Database query repositories
│       │   ├── tools/                    # Agent-callable tools
│       │   ├── domain/                   # Business rules and calculations
│       │   ├── auth/                     # User and organization scope
│       │   ├── imports/                  # CSV parsing and validation
│       │   ├── recommendations/          # Recommendation logic
│       │   ├── heatmap/                  # Layout and indicator logic
│       │   └── audit/                    # Audit logging
│       └── tests/                        # API and service tests
│
├── packages/
│   ├── db/                               # Drizzle schema and migrations
│   │   ├── src/schema/                   # Database table definitions
│   │   ├── migrations/                   # Generated migrations
│   │   └── seed/                         # Seed and demo data
│   │
│   ├── shared/                           # Shared TypeScript types
│   │   ├── src/types/                    # DTOs and domain types
│   │   ├── src/validation/               # Shared schemas
│   │   └── src/constants/                # Shared constants
│   │
│   ├── agent/                            # Provider-independent agent layer
│   │   ├── src/providers/
│   │   │   ├── OpenCodeAgentProvider.ts
│   │   │   ├── MockAgentProvider.ts
│   │   │   └── BedrockAgentCoreProvider.ts
│   │   ├── src/prompts/                  # Agent instructions
│   │   ├── src/tools/                    # Tool contracts
│   │   └── src/traces/                   # Agent execution traces
│   │
│   └── ui/                               # Reusable UI components
│
├── scripts/
│   ├── seed.ts                           # Create demo records
│   ├── generate-sales.ts                 # Generate synthetic sales data
│   ├── import-csv.ts                     # Import sample CSV files
│   └── evaluate-agent.ts                 # Run agent evaluation cases
│
├── fixtures/
│   ├── products.csv                      # Sample product data
│   ├── stores.csv                        # Sample store and locations
│   ├── batches.csv                       # Sample batch data
│   ├── sales.csv                         # Sample daily sales
│   └── evaluation-cases.json             # Expected agent behavior
│
├── infra/
│   ├── docker-compose.yml                # Local PostgreSQL
│   ├── aws/                              # Optional AWS deployment files
│   └── env.example                       # Environment variable template
│
├── docs/
│   ├── architecture.md                   # System architecture
│   ├── data-dictionary.md                # Data definitions
│   ├── agent-tools.md                    # Tool contracts
│   ├── evaluation-plan.md                # Evaluation methodology
│   └── decisions/                        # Architecture decision records
│
├── package.json
├── bun.lockb
├── tsconfig.json
├── drizzle.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── readMe.md
```

For a public Git repository, rename this file to `README.md` if standard GitHub naming is preferred. The requested project copy is named `readMe.md`.

## Naming conventions

Use consistent names so the frontend, backend, database and agent tools are easy to navigate.

### Directories

Use lowercase kebab-case for multi-word directories. Use plural names for collections of the same type.

```text
routes/
services/
product-catalog/
approval-records/
```

Avoid mixed styles such as `ProductCatalog/`, `product_catalog/` and `productCatalog/` for directories.

### TypeScript files

Use lowercase kebab-case with a role suffix:

```text
recommendation.routes.ts
recommendation.service.ts
recommendation.repo.ts
recommendation.schema.ts
recommendation.types.ts
expiry-risk.ts
```

Use `.test.ts` for tests and `.spec.ts` only if the project adopts that convention consistently.

Use PascalCase for React component files when the file exports a component with the same name:

```text
RiskBadge.tsx
ExpiryRiskTable.tsx
StoreHeatmap.tsx
```

### TypeScript identifiers

- Variables and functions: `camelCase`
- Classes and React components: `PascalCase`
- Interfaces and type aliases: `PascalCase`
- Boolean variables: use an `is`, `has`, `can` or `should` prefix
- Constants: `UPPER_SNAKE_CASE` for true global constants
- Enum values: `UPPER_SNAKE_CASE` or the project’s selected TypeScript style, used consistently

```ts
const MAX_IMPORT_ROWS = 10_000
const isExpired = batch.expiryDate < today
type RecommendationStatus = 'draft' | 'approved' | 'rejected'
class RecommendationService {}
```

### Backend layer names

Use the same singular domain name across the layers:

```text
routes/recommendation.routes.ts
services/recommendation.service.ts
repo/recommendation.repo.ts
domain/recommendation-rules.ts
tools/create-recommendation.tool.ts
```

Use `routes` for HTTP concerns, `services` for use cases, `repo` for database queries, `domain` for deterministic business rules and `tools` for agent-facing adapters.

### Database names

Use lowercase snake_case for PostgreSQL identifiers. Use plural table names and singular foreign-key columns.

```text
organizations
organization_members
store_locations
inventory_transactions
recommendations
created_at
organization_id
```

Use `id` for primary keys and `<entity>_id` for foreign keys. Use `created_at` and `updated_at` for timestamps where applicable.

### API names

Use plural, lowercase, kebab-case resource paths:

```text
GET    /products
GET    /expiry-risks
GET    /recommendations/:id
POST   /recommendations/:id/approve
POST   /layouts/:id/simulate
```

Use HTTP methods to express the operation. Avoid paths such as `/getProducts`, `/doApproval` or `/runSomething`.

### Agent tools

Name tools with a clear verb and noun, followed by `.tool.ts`:

```text
get-store-summary.tool.ts
get-expiry-risks.tool.ts
calculate-demand.tool.ts
find-transfer-candidates.tool.ts
simulate-product-placement.tool.ts
request-manager-approval.tool.ts
```

Tool names should describe one controlled operation. Avoid a generic tool such as `execute-anything.tool.ts`.

### Environment variables

Use uppercase snake_case:

```text
DATABASE_URL
API_URL
AGENT_PROVIDER
AWS_REGION
BEDROCK_MODEL_ID
```

Never commit real values for passwords, tokens, AWS keys or model API keys.

### Git branches and commits

Use short lowercase branch names with a type prefix:

```text
feat/csv-import
fix/expiry-risk-calculation
docs/update-readme
test/recommendation-tools
```

Use clear commit messages:

```text
feat: add batch expiry-risk calculation
fix: prevent cross-store recommendation queries
test: cover transfer candidate rules
docs: explain local agent setup
```

## MVP modules

### Authentication and Organization Management

Controls user identity, organization membership, store scope, roles and approval history.

### Data Import from CSV

Accepts product, store, batch and sales data in a defined format. Validates data before import and reports invalid rows.

### Batch System

Tracks stock by batch, expiry date, store and quantity status instead of treating all product units as identical.

### Dashboard

Summarizes risk, expiry, stock-outs, pending approvals and data quality. It provides drill-down to the exact batch or product.

### Notification and Recommendation

Uses controlled analysis tools and the agent to identify urgent risks, explain the evidence and draft recommended actions. Managers approve or reject actions.

### Store Heatmap Planner

Displays product positions and overlays demand, expiry, waste and stock-out indicators on a simple 2D store map. It supports proposed layout simulation.

## Agent tools

The agent should use a small, explicit set of tools:

```text
get_store_summary(store_id)
get_expiry_risks(store_id, expiry_window, risk_level)
get_batch_detail(batch_id)
calculate_demand(product_id, store_id, horizon_days)
calculate_reorder_review(product_id, store_id)
find_transfer_candidates(batch_id)
simulate_product_placement(layout_id, product_id, target_location_id)
create_notification(alert_type, target_user_id, evidence_ids)
create_recommendation(recommendation_type, evidence_ids, reason)
request_manager_approval(recommendation_id)
record_manager_decision(recommendation_id, decision, reason)
```

Do not expose unrestricted SQL, shell access or a generic database-update tool to the agent.

## Data model

The MVP uses these main entities:

```text
users
organizations
organization_members
stores
store_locations
products
suppliers
batches
inventory_transactions
sales_records
risk_results
notifications
recommendations
layout_versions
product_positions
approval_records
import_jobs
import_errors
audit_logs
```

Important relationship:

```text
organization → stores → locations
organization → products → batches
store + product + date → sales records
batch + demand estimate → risk result
risk result → recommendation → approval record
store + layout version → product positions
```

## Getting started locally

### Prerequisites

Install:

- Git
- Bun
- Node.js, if required by a local tool
- Docker Desktop or Docker Engine
- PostgreSQL client tools, optional
- OpenCode with GLM-5.3-Flash Free when available, or a deterministic mock agent

### Clone the repository

```bash
git clone <repository-url>
cd shelfflow
```

### Install dependencies

```bash
bun install
```

### Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Example local variables:

```env
NODE_ENV=development
DATABASE_URL=postgresql://shelfflow:shelfflow@localhost:5432/shelfflow
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
AGENT_PROVIDER=local
CSV_STORAGE_PATH=./local-data/imports
```

Do not commit `.env` or secret keys to Git.

### Start PostgreSQL

```bash
docker compose up -d postgres
```

### Run migrations

```bash
bun run db:generate
bun run db:migrate
```

### Seed demo data

```bash
bun run db:seed
```

### Start the API

```bash
bun run dev:api
```

### Start the web app

```bash
bun run dev:web
```

Open:

```text
http://localhost:3000
```

The exact script names may change as the project is implemented. Keep this README synchronized with `package.json`.

## Suggested scripts

```json
{
  "dev:web": "bun --cwd apps/web dev",
  "dev:api": "bun --cwd apps/api dev",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "bun scripts/seed.ts",
  "test": "bun test",
  "lint": "bun run lint",
  "typecheck": "tsc --noEmit",
  "evaluate:agent": "bun scripts/evaluate-agent.ts"
}
```

## CSV formats

### Products

```csv
sku,barcode,product_name,category,unit,storage_type,shelf_life_days,supplier_code
YOG-001,885000000001,Strawberry Yogurt,Dairy,carton,chilled,14,SUP-001
```

### Batches

```csv
store_code,sku,batch_code,received_date,expiry_date,received_quantity,remaining_quantity,reserved_quantity,status
STORE-01,YOG-001,BATCH-012,2026-10-01,2026-10-10,100,80,0,available
```

### Sales

```csv
store_code,sku,sales_date,units_sold,available_stock,stockout_flag,promotion_flag
STORE-01,YOG-001,2026-10-05,10,80,false,false
```

## Security rules

- Scope every query by organization and store.
- Never trust an organization or store ID supplied by the agent.
- Validate tool parameters on the server.
- Keep read-only and state-changing tools separate.
- Require manager approval for operational actions.
- Record imports, recommendations, approvals and layout changes.
- Do not store production personal data in the student demo.
- Do not commit AWS keys or model API keys.
- Use local mock data for development.

## Testing

### Unit tests

Test:

- Expiry-day calculation
- Demand estimate
- Estimated surplus at expiry
- Risk classification
- Reorder review
- Transfer candidate rules
- Shelf capacity validation
- Temperature compatibility
- Heatmap indicators

### API tests

Test:

- Organization scoping
- Role permissions
- CSV validation
- Batch creation
- Inventory transactions
- Recommendation approval
- Layout simulation
- Audit logging

### Agent tests

Use scripted questions and check:

- Correct tool selection
- Valid tool parameters
- Correct evidence use
- No invented quantities or dates
- Correct handling of missing data
- Approval required before state changes
- Clear explanation of assumptions

Run the same test set with `OpenCodeAgentProvider`, `MockAgentProvider` and, if available, `BedrockAgentCoreProvider`.

## Cost policy

The MVP must be buildable without paid cloud services.

### Required zero-cost mode

- Local PostgreSQL
- Local API
- Local frontend
- Local CSV files
- Local agent runtime or mock agent
- Synthetic or anonymized data

### Optional AWS mode

Use AWS only after checking the account plan, service availability, region and free-tier limits. Bedrock model inference and AgentCore usage are not assumed to be free. If AWS credits are available, set budget alerts and limit calls.

The AWS migration must not change the business rules or evaluation dataset.

## Evaluation

Compare two workflows:

### Baseline

The user searches a normal inventory or batch table and manually interprets the expiry information.

### ShelfFlow agentic workflow

The user asks the agent, receives evidence-backed analysis, reviews the dashboard and approves or rejects a recommendation.

Measure:

- Task completion time
- Correctly identified high-risk batches
- Correct action selection
- Explanation understanding
- Unsupported claims
- Tool-call success
- Unauthorized action attempts
- User confidence
- Agent latency
- AWS cost per scenario, if AWS mode is tested

## Development roadmap

1. Confirm scope and prepare the data dictionary.
2. Build the local database and CSV importer.
3. Build batch and expiry-risk services.
4. Build the dashboard.
5. Build the provider-independent agent tools.
6. Add the local agent adapter or mock agent.
7. Build notifications and approval workflow.
8. Build the Store Heatmap Planner.
9. Evaluate the baseline against the agentic workflow.
10. Migrate selected services to AWS only if funding is available.

## Known limitations

- CSV data may not represent all supermarket systems.
- Synthetic data cannot prove real-world waste reduction.
- Demand estimates may be inaccurate when history is short or stock-outs are unknown.
- Heatmap associations do not prove that a shelf position causes sales changes.
- Agent responses require evaluation and may contain errors.
- The MVP does not replace food-safety policy or manager judgment.
- AWS deployment may require credits or paid usage.

## Contributing

For academic development:

1. Create a feature branch.
2. Add or update tests.
3. Run type checking and linting.
4. Update documentation when behavior changes.
5. Open a pull request with a clear description.

## License

Choose a license before publishing the repository. For a private academic project, keep the repository private until the supervisor and project team agree on the sharing policy.

## Contact

Project owner: `<your-name>`  
Institution: `<your-university>`  
Supervisor: `<supervisor-name>`  
Project repository: `<repository-url>`
