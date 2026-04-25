# Compliance Posture

ClearFinTech operates under four regulatory frameworks. Compliance is structural — enforced by the architecture, the governance policy in `.agentpolicy/`, and the quality gates that block any change failing them. This document summarizes how each framework is satisfied today.

## PCI-DSS

**Scope.** ClearFinTech processes credit card, debit card, and ACH transactions. The cardholder data environment (CDE) is the `customers/` domain.

**Controls.**

- Card numbers (PAN) and bank account numbers are tokenized immediately upon ingestion. Raw values are never stored in plaintext, written to logs, displayed in full on any screen, or returned by any API response.
- The CDE is structurally isolated. Outside `customers/`, every other domain accesses payment credentials only through `ICustomerVault`, which returns tokenized references — never raw PAN.
- All cardholder data at rest is encrypted with AES-256-GCM. Encryption keys are themselves high-tier sensitive data and remain inside the customers domain.
- The merchant dashboard receives only tokenized or masked data. There is no de-tokenization endpoint exposed outside `customers/`.

**Evidence.**

- Code: `customers/` domain (vault, tokenizer, masking).
- Tests: `customers/tests/encryption.test.ts`, `tokenizer.test.ts`, `masking.test.ts`, `vault.test.ts`, `vault.integration.test.ts`.
- Audit log: every read of customer data writes an audit entry via `IAuditLog`.

## SOX

**Scope.** Every financial transaction, every modification to financial records, and every generated report has a complete, immutable audit trail.

**Controls.**

- Audit entries are written through the `IAuditLog` shared interface for every operation touching financial data or PII. Each entry captures who performed the action, what was done, when, in which domain, and the outcome.
- Audit entries are frozen with `Object.freeze` after creation. The constitution's `audit-trail-immutable` principle (priority: hard enforcement) and the compliance role's forbidden action — *"Modifying, updating, or deleting transaction records after they have been committed to the ledger"* — make modification structurally impossible at the agent layer.
- No agent or human role has override authority on audit completeness. Quality gates are absolute: `.agentpolicy/governance.json → quality_gate.override_authority: "none"`.

**Evidence.**

- Code: `compliance/` domain (audit trail, ledger).
- Tests: `compliance/tests/audit-trail.test.ts`, `compliance.integration.test.ts`.
- QA sign-off: every change is reviewed for audit trail completeness before merge. Reports preserved in `qa/reports/`.

## AML/KYC

**Scope.** Anti-Money Laundering and Know Your Customer obligations under FinCEN guidance.

**Controls.**

- Merchants are verified before they can process payments. Identity verification runs in `compliance/` and is exposed to `onboarding/` only through the `IComplianceVerification` interface — which returns risk assessments and verification results, never raw verification artifacts or SAR data.
- Transactions are screened against configurable AML thresholds:
  - `AML_THRESHOLD_SINGLE_TRANSACTION` (default $10,000) — single-transaction trigger.
  - `AML_THRESHOLD_CUMULATIVE_DAILY` (default $25,000) — cumulative daily trigger.
- When thresholds are exceeded, alerts are generated within the compliance domain and Suspicious Activity Reports (SARs) are filed with FinCEN.
- **SAR existence is restricted under federal law.** SAR data, SAR existence/status, and FinCEN filing payloads are tier-restricted: forbidden in logs, forbidden in any display outside compliance, forbidden over any cross-domain transmission. The `IComplianceVerification` interface is structurally incapable of returning SAR data.

**Evidence.**

- Code: `compliance/aml-monitor.ts`, `compliance/sar-filing.ts`, `compliance/identity-verification.ts`.
- Tests: `compliance/tests/aml-monitor.test.ts`, `sar-filing.test.ts`, `identity-verification.test.ts`, `compliance.integration.test.ts`.
- Boundary verification: `payments/` role file forbids access to `compliance/` internals; `compliance/` role file forbids access to `payments/` internals.

## Data Privacy

**Scope.** Customer Personally Identifiable Information (PII) including SSNs, bank account numbers, routing numbers, dates of birth, and home addresses.

**Controls.**

- All PII is encrypted at rest using AES-256-GCM in the `customers/` vault.
- PII is never exposed in raw form outside the vault. Outside `customers/`, every PII field appears only in masked or tokenized form (see SECURITY.md for the masking table).
- The dashboard never receives raw PII or unmasked financial data — its role file forbids displaying any high or restricted-tier data and forbids implementing any de-tokenization logic.
- Access to raw PII is audited. Every vault read writes an audit log entry via `IAuditLog`.
- Seed and synthetic data in `data/` is treated with the same handling rules as production data. There are no "it's just test data" exceptions. The `data/` directory is locked to customers-domain access only.

**Evidence.**

- Code: `customers/` domain (vault, encryption, tokenizer, masking).
- Tests: `customers/tests/encryption.test.ts`, `masking.test.ts`, `tokenizer.test.ts`, `vault.test.ts`, `vault.integration.test.ts`.
- Constitution principle: `seed-data-as-production` (priority 8, hard enforcement).

## Quality Gates as Compliance Evidence

Every change must pass every gate before it ships. Gates are absolute and non-overridable.

| Gate | Purpose | Evidence path |
|---|---|---|
| Typecheck | TypeScript strict mode, zero errors | `.github/workflows/ci.yml` job: `quality-gates` |
| Lint | ESLint flat config, zero errors | same |
| Tests | 23 suites, unit and integration | same |
| Snyk dependency scan | Independent vulnerability scan against published CVE databases | `.github/workflows/ci.yml` job: `snyk-security-scan` |
| Snyk code analysis | Static analysis for hardcoded secrets, PII exposure patterns, insecure crypto usage | same |
| QA sign-off | Cross-domain handoff verification, audit trail completeness, sensitivity tier compliance | `qa/reports/` |

## Independent Validation

Two layers of independent validation protect against the agent-blind-spot failure mode where the same author writes both the code and the test that validates it:

1. **Integration tests are authored by QA only**, never by the domain agent that wrote the code under test. Domain agents write only their own unit tests. This is enforced by `governance.json → quality_principles → integration-tests-by-qa-only` (strict) and the constitutional principle `independent-test-validation` (priority 10, hard).
2. **Snyk** is a third-party tool whose vulnerability database and scanning rules were not authored by any agent on this project. Its results stand outside the local trust loop entirely.

## Compliance-Adjacent Operating Rules

- **Ask before accessing sensitive data.** When in doubt about whether data is sensitive or whether an operation is compliant, agents stop and ask. No best-guess on compliance-adjacent operations. (Constitution principle, priority 9, hard.)
- **Cross-domain interfaces only.** No domain reaches into another domain's internals. The only legal crossing point is `shared/interfaces/`. (Constitution principle, hard.)
- **Boundary discipline.** Each domain owns its slice and nothing else. Roles enumerate writable paths exhaustively; everything else is denied. (Aegis enforces.)

## Auditor's Quick Index

Where to find what an auditor most often asks for:

| Request | Location |
|---|---|
| "Show me how cardholder data is isolated." | `customers/` domain code; `shared/interfaces/ICustomerVault.ts`. |
| "Show me the audit log implementation." | `compliance/audit-trail.ts`; `shared/interfaces/IAuditLog.ts`. |
| "Show me your AML thresholds." | `.env.example`; `compliance/aml-monitor.ts`. |
| "How do you verify nothing crossed a domain boundary illegally?" | `qa/reports/` (QA validation reports); `.agentpolicy/roles/*.json` (write-path scopes). |
| "Show me your release gate evidence." | `.github/workflows/ci.yml`; `qa/reports/`. |
| "How are policy overrides recorded?" | `.agentpolicy/state/overrides.jsonl` (immutable append-only ledger of every overridden action with human confirmation). |

## References

- `charter.md` — company charter and compliance commitments.
- `README.md` — architecture overview, quality gate commands, sensitivity tier table.
- `SECURITY.md` — security policy, vulnerability disclosure, architectural controls.
- `.agentpolicy/constitution.json` — constitutional principles, required artifacts, sensitivity tiers.
- `.agentpolicy/governance.json` — quality gates, review gates, override protocol.
- `.agentpolicy/roles/*.json` — per-domain write scopes, forbidden actions, escalation triggers.
