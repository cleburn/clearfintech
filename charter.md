# ClearFinTech — Company Charter

## Who We Are

ClearFinTech is a payment processing and merchant services platform built for small-to-mid-size businesses. We handle the financial infrastructure so our merchants can focus on running their businesses — not worrying about payment compliance, fraud, or regulatory reporting.

## What We Do

**Merchant Onboarding:** Businesses sign up, submit their information, and get approved to process payments through our platform. We verify their identity, assess their risk profile, and assign them a merchant tier (Standard, Premium, or Enterprise) based on their transaction volume and business type.

**Payment Processing:** We process credit card, debit card, and ACH transactions on behalf of our merchants. Every transaction flows through our system — authorization, capture, settlement, and reconciliation. We handle refunds, chargebacks, and disputes.

**Customer Data Management:** We store customer information for our merchants — names, contact information, payment methods, and transaction histories. This data belongs to the merchants and their customers. We are custodians, not owners.

**Compliance & Regulatory Reporting:** We generate reports for regulatory bodies, monitor transactions for suspicious activity, file Suspicious Activity Reports (SARs) when required, and maintain complete audit trails of every financial operation that touches our platform.

**Merchant Dashboard:** Our merchants get a web portal where they can view transactions, manage their account settings, download reports, and monitor their payment activity in real time.

## What We Handle That Requires Legal Compliance

This is non-negotiable. We operate in a regulated industry and the following compliance obligations govern everything we build:

**PCI-DSS (Payment Card Industry Data Security Standard):** We handle credit and debit card data. Card numbers must be tokenized immediately — they are never stored in plaintext, never written to logs, never displayed in full on any screen, and never included in any report or export. The cardholder data environment must be completely isolated from the rest of the system.

**SOX (Sarbanes-Oxley Act):** Every financial transaction, every modification to financial records, and every generated report must have a complete, immutable audit trail. No one — human or machine — can alter historical financial records. Audit logs capture who did what, when, and why.

**AML/KYC (Anti-Money Laundering / Know Your Customer):** Before a merchant can process payments, we verify their identity. We monitor transaction patterns for suspicious activity — unusual volumes, rapid velocity changes, structuring patterns. When thresholds are triggered, we file SARs with FinCEN. This data is among the most sensitive in our system.

**Data Privacy:** Customer personally identifiable information (PII) — Social Security numbers, bank account numbers, routing numbers, dates of birth, home addresses — must be encrypted at rest, masked in any user-facing display, and never exposed in logs, error messages, or API responses. Access to raw PII is restricted and audited.

## Our Customers

Small-to-mid-size businesses across the United States. Retail shops, restaurants, e-commerce stores, service providers, professional practices. They range from single-location businesses processing a few thousand dollars a month to multi-location operations processing millions annually.

## Our Team Philosophy

We believe in building systems where the rules are clear, the boundaries are explicit, and compliance is structural — not aspirational. In a regulated industry, "we'll be careful" is not a compliance strategy. The platform should make it impossible to violate compliance, not just difficult.

Every person and every tool that touches this codebase operates under the same principle: if you're not sure whether something is allowed, stop and ask. The cost of asking is a few minutes. The cost of a compliance violation is existential.

## What Success Looks Like

A merchant signs up, gets verified, and starts processing payments within hours. Every transaction is processed accurately, settled on time, and recorded immutably. Every compliance obligation is met automatically, not manually. Our merchants never think about PCI or SOX or AML — they just know their payments work and their business is protected.

We are the infrastructure they trust with their money and their customers' data. That trust is earned by building systems that are structurally sound, not by making promises we enforce with good intentions.
