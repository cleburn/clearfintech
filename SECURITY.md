# Security Policy

ClearFinTech operates as a payment processing and merchant services platform. Security is structural — enforced by the architecture and the governance policy in `.agentpolicy/`, not by aspirational documents. This file describes how to report a vulnerability and summarizes the controls that protect customer and merchant data.

## Reporting a Vulnerability

If you believe you have discovered a vulnerability in ClearFinTech, please report it privately. **Do not open a public GitHub issue, pull request, or discussion thread.**

- **Email:** security@clearfintech.example *(replace with the operational address before publishing externally)*
- **Subject prefix:** `[SECURITY]`
- **Response SLA:** acknowledgement within 2 business days; triage outcome within 5 business days.

Please include:

1. A clear description of the vulnerability and its impact.
2. Reproduction steps, including any required preconditions, sample inputs, or proof-of-concept code.
3. The affected version, branch, or commit SHA if known.
4. Whether the issue has been disclosed elsewhere.

We will coordinate a fix, a release, and — where appropriate — a public disclosure timeline with you. We do not currently operate a bug bounty program; recognition is at the maintainer's discretion.

## Sensitivity Tiers

All data handled by ClearFinTech falls into one of three tiers. Tier dictates how the data may be logged, displayed, transmitted, stored, and crossed between domains.

| Tier | Examples | Logging | Display | Transmission | Storage | Cross-Domain |
|---|---|---|---|---|---|---|
| **Restricted** | SAR filing data, SAR existence/status, FinCEN payloads | Forbidden | Forbidden | Compliance-internal only | Encrypted at rest, compliance domain only | Forbidden |
| **High** | Card numbers (PAN), SSNs, bank account and routing numbers, encryption keys, JWT secrets, merchant tax IDs/EINs, names combined with financial data, customer bank info | Forbidden | Tokenized or masked only | Encrypted and tokenized | AES-256-GCM at rest | Tokenized interface only |
| **Standard** | Merchant business names, merchant tier, transaction status (non-financial), onboarding workflow state | Permitted, no correlation with higher tiers | Permitted | Encrypted in transit | Standard | Through `shared/interfaces/` only |

The Restricted tier reflects federal-law obligations: SAR existence itself is restricted information and may not be acknowledged outside the compliance domain.

## Architectural Controls

### Domain Isolation

The codebase is split into seven structurally isolated domains: `gateway`, `onboarding`, `payments`, `compliance`, `customers`, `dashboard`, and `shared`. Cross-domain communication is only legal through typed contracts in `shared/interfaces/`. No domain imports directly from another domain's internals.

Two hard walls are enforced:

- **Payments ↔ Compliance** — these domains never share state. Compliance reads no payment internals; payments reads no compliance internals.
- **Customers (PII vault)** — outside `customers/`, every other domain receives masked or tokenized data exclusively via `ICustomerVault`. Raw PII does not cross the boundary.

### Encryption at Rest

All PII and high-tier financial data is encrypted at rest using AES-256-GCM. Encryption keys themselves are high-tier and never logged, displayed, or transmitted outside the customers domain.

### Tokenization and Masking

Outside `customers/`, every PII or financial field is reduced to a tokenized or masked representation before it leaves the vault:

| Data | Form outside the vault |
|---|---|
| Names | `R***** M*******` |
| Email | `ro***************@yahoo.com` |
| Phone | `******3615` |
| SSN | `***-**-****` |
| Account numbers | `*******0838` |

The dashboard, merchant portal, and any external API response see only these forms. There is no de-tokenization endpoint exposed outside the customers domain.

### Immutable Audit Trail

Every operation that touches financial data or PII writes an entry to the audit log via the `IAuditLog` interface. Audit entries are frozen with `Object.freeze` after creation and cannot be modified, redacted, or deleted by any agent — including QA. Audit completeness is one of the quality gates QA verifies before sign-off.

### Authentication and Rate Limiting

The `gateway/` domain is the single legal entry point for all external requests. JWT authentication is enforced at the gateway layer, and rate limiting is applied per-merchant before any request reaches a downstream domain. No domain accepts traffic that has not transited the gateway.

## Quality Gates

Every change must pass all required gates before it ships. Gates are absolute — no person and no agent may override or bypass them (`.agentpolicy/governance.json → quality_gate.override_authority: "none"`).

- **Typecheck** — TypeScript strict mode, zero errors (`npm run typecheck`).
- **Lint** — ESLint flat config, zero errors (`npm run lint`).
- **Tests** — all unit and integration tests pass (`npm test`). 23 suites currently in tree.
- **Snyk dependency and code scan** — third-party security validation that no project agent authored. Catches dependency vulnerabilities, hardcoded secrets, PII exposure patterns, and insecure crypto usage. Runs on every push and pull request via `.github/workflows/ci.yml`.
- **QA sign-off** — QA agent reviews cross-domain handoffs, audit trail completeness, sensitivity-tier compliance, and quality gate results before any change ships. Reports are preserved in `qa/reports/`.

## Independent Test Validation

Integration tests are authored by the QA agent, not by the domain agent that wrote the code under test. Domain agents write only their own unit tests. This breaks the circular trust loop where the same agent's blind spots propagate to both the code and the tests intended to validate it. Snyk's third-party scan provides an additional independent baseline that no project agent authored.

## Secret Handling

- Secrets (JWT signing keys, encryption keys, FinCEN API key, database credentials) are loaded from environment variables only. See `.env.example` for the canonical list.
- `.env`, `.env.local`, `.env.production`, and `.env.staging` are excluded from the repository via `.gitignore`. Real secret values must never be committed.
- The `SNYK_TOKEN` used by the security scan gate is provisioned as a GitHub Actions repository secret, never as a file or commit.
- Aegis governance scans every write for sensitive patterns; commits that would introduce a credential or PII pattern are blocked at the agent layer.

## Out of Scope

Reports unrelated to the security of customer data, merchant data, or the integrity of the financial transaction lifecycle are out of scope. Examples:

- Issues in dependencies that are not exploitable in the way ClearFinTech uses them.
- Theoretical attacks against domain isolation that require pre-existing administrator access to the host.
- Security headers on documentation-only pages.

We still appreciate hearing about these — they may be tracked as hardening work — but they are not security incidents.

## References

- `charter.md` — company charter and compliance commitments.
- `README.md` — architecture overview and quality gate commands.
- `COMPLIANCE.md` — PCI-DSS, SOX, AML/KYC, and data privacy posture.
- `.agentpolicy/constitution.json` — constitutional principles and required artifacts.
- `.agentpolicy/governance.json` — quality gates, review gates, conventions.
