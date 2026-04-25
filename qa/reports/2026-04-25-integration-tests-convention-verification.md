# QA Report — Integration Test Convention Verification

**Date:** 2026-04-25
**Author:** QA agent (Aegis session: construction role, governance v0.3.0 uncommitted)
**Scope:** Verify that the existing test suite is consistent with the new `integration-tests-by-qa-only` convention introduced in the uncommitted policy diff (governance.json + each domain role file).
**Trigger:** Policy update adding `integration-tests-by-qa-only` (governance.json `quality_principles`, enforcement: strict) and the matching `independent-test-validation` constitutional principle (priority 10, hard enforcement).

---

## Convention under review

> Integration tests must be written by the QA agent, not by the domain agent that wrote the code under test. Domain agents write their own unit tests. This breaks the circular trust loop where the same agent's blind spots propagate to both code and test layers.
> — `governance.json → quality_principles[id=integration-tests-by-qa-only]`

The convention is mirrored in each non-default role file as a forbidden action:

> Writing integration tests for own code (integration tests must come from QA)

And as a convention attribute:

> `integration_test_authorship: qa-only`

---

## Verification — applies to new work only

Per the project owner's explicit direction during this session: **the convention applies to new work only. Existing tests are not to be rewritten.**

This report documents the verification that the existing suite is structurally compatible with the new convention going forward — that is, integration tests already live in identifiable, separable files so that future authorship can be attributed correctly without rewriting history.

---

## Inventory — existing test suite

23 test files counted across seven domains, matching the README's claim of "23 suites / 109 tests":

| Domain | Unit tests | Integration tests | Total |
|---|---|---|---|
| `gateway/tests/` | `auth.test.ts`, `rate-limiter.test.ts`, `router.test.ts` | `gateway.integration.test.ts` | 4 |
| `onboarding/tests/` | `application.test.ts`, `orchestrator.test.ts`, `workflow.test.ts` | `onboarding.integration.test.ts` | 4 |
| `payments/tests/` | `authorization.test.ts`, `settlement.test.ts` | `payments.integration.test.ts` | 3 |
| `compliance/tests/` | `aml-monitor.test.ts`, `audit-trail.test.ts`, `identity-verification.test.ts`, `sar-filing.test.ts` | `compliance.integration.test.ts` | 5 |
| `customers/tests/` | `encryption.test.ts`, `masking.test.ts`, `tokenizer.test.ts`, `vault.test.ts` | `vault.integration.test.ts` | 5 |
| `dashboard/tests/` | `merchant-portal.test.ts`, `transaction-view.test.ts` | *(none)* | 2 |
| **Totals** | **17** | **6** | **23** |

Naming convention: every integration test file uses the `*.integration.test.ts` suffix. Unit tests use the bare `*.test.ts` suffix. The separation is filename-level, not directory-level — Jest discovers both via `jest.config.ts`. This means future enforcement (e.g., authorship checks tied to file paths or PR diff scopes) can rely on the suffix as a reliable discriminator.

`dashboard/` has no integration test today. The dashboard role's convention (`testing: unit-tests-required`) does not require one — dashboard consumes only tokenized/masked data via `shared/interfaces/` and has no cross-domain handoff of its own to integrate against. This is consistent with the policy diff and not flagged as a gap.

---

## Findings

1. **Existing tests stand.** No rewrites are required or authorized. The convention is forward-only.
2. **File-level separation is sufficient for forward enforcement.** Future integration tests authored by QA will land in the same `*.integration.test.ts` slots, replacing or extending the existing files as code under test evolves. The policy update to `qa.json` already grants QA write access to `*/tests/` directories with a `write_mode_exceptions` clause permitting create+update on integration tests (while keeping `qa/reports/` strictly append-only).
3. **No unit-test authorship exposure for QA.** The qa role's forbidden actions explicitly include "Writing unit tests (unit tests are the responsibility of the domain agent that wrote the code)". This direction is reciprocally enforced — domain roles forbid writing their own integration tests, and QA forbids writing unit tests. No agent owns both halves of any single domain's test surface.
4. **No re-attribution of existing test authorship.** The existing 23 suites were authored during the construction-mode session recorded in `.agentpolicy/state/overrides.jsonl` (entry dated 2026-04-15, `human_confirmed: true`, agent_role: `construction`). Those files were lawfully authored under construction authority and remain valid; they pre-date the integration-tests-by-qa-only convention and need no transfer of authorship.

---

## Recommendation for forward enforcement

Once the policy diff lands, these are the structural enforcement points already wired:

- **Aegis path enforcement** — domain roles' write paths exclude QA-owned integration test files? No — currently each domain role can still write to its own `*/tests/` directory. The convention is enforced via `forbidden_actions` (a soft policy assertion logged via Aegis), not via path scope. If stricter enforcement is desired in a future revision, consider moving integration tests to a sibling directory (e.g. `*/tests/integration/`) excluded from the domain role's write scope but included in QA's.
- **Snyk security scan gate** (separate but related) — added as a `review_gate` (required, scope: all) and `custom_check` in governance.json. Wired into `.github/workflows/ci.yml` in this session as a peer job to `quality-gates`. Requires `SNYK_TOKEN` provisioned as a GitHub Actions secret (confirmed in place by project owner during this session).

---

## Sign-off

Convention verification complete. Existing suite respects the convention's forward-only application. No rewrites performed. No quality gates affected.

This report is preserved as audit evidence per `qa.json → report_format` (append-only, preserved). Subsequent reports referencing this verification should cite the filename: `2026-04-25-integration-tests-convention-verification.md`.
