# ClearFinTech

Payment processing and merchant services platform built for small-to-mid-size businesses. ClearFinTech handles the financial infrastructure — payment compliance, fraud monitoring, and regulatory reporting — so merchants can focus on running their businesses.

## What It Does

- **Merchant Onboarding** — Businesses submit an application, pass identity verification (KYC), receive a risk assessment, and get provisioned with a payment account. Merchants are assigned a tier (Standard, Premium, or Enterprise) based on volume and business type.
- **Payment Processing** — Credit card, debit card, and ACH transactions flow through a full lifecycle: authorization, capture, settlement, and reconciliation. Refunds, chargebacks, and disputes are handled within the same pipeline.
- **Customer Data Management** — Customer PII and payment methods are stored in an encrypted vault. Other parts of the system access customer data only through tokenized and masked interfaces. The data belongs to the merchants and their customers — we are custodians, not owners.
- **Compliance & Regulatory Reporting** — Transactions are monitored for suspicious activity against AML thresholds. Suspicious Activity Reports (SARs) are filed with FinCEN when required. Every financial operation produces an immutable audit trail entry.
- **Merchant Dashboard** — Merchants view transactions, manage account settings, and monitor payment activity through a portal that only ever receives tokenized or masked data.

## Architecture

ClearFinTech is a TypeScript monorepo with hard domain separation. Each domain is structurally isolated — cross-domain communication happens exclusively through typed contracts in `shared/interfaces/`. No domain imports directly from another domain's internals.

```
clearfintech/
├── shared/          # Types, interfaces, constants — the only legal crossing point between domains
├── gateway/         # Unified API entry point: routing, JWT authentication, rate limiting
├── onboarding/      # Merchant lifecycle orchestration (calls compliance and payments via shared interfaces)
├── payments/        # Transaction lifecycle: authorization, capture, settlement, refunds
├── compliance/      # AML monitoring, SAR filing, audit trails, identity verification
├── customers/       # PII vault: AES-256-GCM encrypted storage, tokenization, masking
├── dashboard/       # Merchant portal (receives only tokenized/masked data)
├── qa/              # Append-only QA reports preserved as audit evidence
└── data/            # Seed data (locked to customers domain, treated as production-grade)
```

### Domain Boundaries

| Domain | Reads From | Writes To | Sensitive Data Access |
|---|---|---|---|
| `gateway` | `gateway/`, `shared/` | `gateway/` | None — routes requests, does not handle PII or financial data |
| `onboarding` | `onboarding/`, `shared/` | `onboarding/` | Orchestrates via shared interfaces only |
| `payments` | `payments/`, `shared/` | `payments/` | Tokenized customer/payment references only |
| `compliance` | `compliance/`, `shared/` | `compliance/` | Full access within domain; SAR/FinCEN data never leaves |
| `customers` | `customers/`, `shared/`, `data/` | `customers/`, `data/` | Raw PII — encrypts at rest, masks/tokenizes before crossing boundary |
| `dashboard` | `dashboard/`, `shared/` | `dashboard/` | None — only tokenized/masked data via shared interfaces |

### Shared Interfaces

All cross-domain communication flows through four typed contracts in `shared/interfaces/`:

- **`ICustomerVault`** — Tokenized access to customer PII. Returns masked names, masked emails, masked phone numbers. Raw data never crosses this boundary.
- **`IComplianceVerification`** — Identity verification results and risk assessments. SAR data, FinCEN content, and filing status are never exposed through this interface.
- **`IPaymentProvisioning`** — Merchant account provisioning, transaction processing, refunds, and settlement batches.
- **`IAuditLog`** — Immutable audit trail. Every operation touching financial data or PII logs through this interface.

## Compliance Posture

ClearFinTech operates under four regulatory frameworks. Compliance is structural — enforced by the architecture, not by policy documents.

### PCI-DSS

Card numbers and bank account details are tokenized immediately upon ingestion. Raw payment credentials are never stored in plaintext, written to logs, displayed in full on any screen, or included in any API response. The cardholder data environment (`customers/`) is completely isolated from the rest of the system.

### SOX

Every financial transaction, modification to financial records, and generated report has a complete, immutable audit trail. Audit entries are frozen after creation (`Object.freeze`) — they cannot be modified or deleted. The audit trail captures who performed the action, what was done, when, in which domain, and the outcome.

### AML/KYC

Merchants are verified before processing payments. Transactions are screened against configurable thresholds ($10,000 single transaction, $25,000 cumulative daily). When thresholds are exceeded, alerts are generated within the compliance domain and SARs are filed with FinCEN. SAR existence itself is restricted information under federal law — it never appears in logs, API responses, or any interface outside the compliance domain.

### Data Privacy

All PII is encrypted at rest using AES-256-GCM. Outside the `customers/` vault, PII is only accessible in masked or tokenized form:

| Data | Masking |
|---|---|
| Names | `R***** M*******` |
| Email | `ro***************@yahoo.com` |
| Phone | `******3615` |
| SSN | `***-**-****` |
| Account numbers | `*******0838` |

### Sensitivity Tiers

| Tier | Examples | Logging | Display | Cross-Domain |
|---|---|---|---|---|
| **Restricted** | SAR filings, FinCEN content | Forbidden | Forbidden | Forbidden |
| **High** | Card numbers, SSNs, bank accounts, encryption keys | Forbidden | Tokenized/masked only | Tokenized interface only |
| **Standard** | Business names, merchant tiers, onboarding status | Permitted (no correlation with higher tiers) | Permitted | Through shared interfaces |

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 20 |
| Database | PostgreSQL |
| Cache | Redis |
| Authentication | JWT |
| Encryption | AES-256-GCM |
| Testing | Jest |
| Linting | ESLint (flat config) |
| CI | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Setup

```bash
# Clone the repository
git clone git@github.com:cleburn/clearfintech.git
cd clearfintech

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your local configuration
```

### Development Commands

```bash
# Run the full test suite (109 tests across 23 suites)
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Start the gateway server
npm run dev
```

### Quality Gates

Every change must pass all three gates before it ships. No exceptions, no overrides.

```bash
npm run typecheck  # TypeScript strict mode — zero errors
npm run lint       # ESLint — zero errors
npm test           # All unit and integration tests pass
```

Regulated domains (`payments`, `compliance`, `customers`, `onboarding`, `gateway`) require both unit and integration tests. Domains that touch financial data or PII require audit trail verification — every operation must produce a corresponding audit log entry.

### Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (256-bit minimum) |
| `ENCRYPTION_KEY` | AES-256-GCM key for PII encryption (64-char hex) |
| `FINCEN_API_KEY` | FinCEN API key for SAR filing |
| `AML_THRESHOLD_SINGLE_TRANSACTION` | Single transaction AML threshold (default: $10,000) |
| `AML_THRESHOLD_CUMULATIVE_DAILY` | Cumulative daily AML threshold (default: $25,000) |

## Project Governance

This project is governed by an Aegis policy defined in `.agentpolicy/`. The policy enforces domain separation, sensitivity tier handling, audit trail completeness, and quality gates at the structural level. See `.agentpolicy/constitution.json` for the full set of principles and `charter.md` for the company charter.
