# Paloma Home Services

Full-stack field service management platform — customer-facing online estimate tool, digital contract signing, invoicing, Stripe payments, and admin operations panel.

**Live:** palomahomeservices.com

---

## What It Is

Paloma Home Services is a complete FSM (field service management) SaaS built for a DFW home services company. It has two sides: a public-facing estimate and ordering flow that lets customers build real quotes, sign contracts, and pay online — and an admin panel for managing the full job lifecycle from lead intake through invoicing and collections.

This is not a simple contact form. Customers select services, get real line-item pricing from a configurable master catalog, review a full estimate, e-sign a contract, and submit a deposit — all without talking to anyone. The backend handles the full order-to-cash workflow.

---

## Platform Overview

**Customer-Facing (Public)**
- Multi-step estimate builder with configurable line item catalog
- Real pricing output with subtotals, taxes, and payment schedule
- Digital contract signature flow with token-authenticated signing URLs
- Online payment (Stripe — deposit, progress payments, final balance)
- Estimate and invoice PDF delivery
- Service area pages for DFW submarkets (local SEO)

**Admin Panel**
- Lead intake and CRM pipeline
- Estimate creation, editing, and status tracking
- Change order management with customer re-sign workflow
- Job lifecycle management (scheduled → in progress → completed)
- Job photo uploads and inspection reports
- Invoice generation and payment recording
- AI-personalized outreach (SMS/email) via outreach templates
- Prospect management and outreach campaign scheduling
- Business directory integration

---

## Data Model

Core entities and their relationships:

```
customers
  └── estimates → estimate_line_items
        └── payment_schedule_items
        └── contract_signatures
        └── change_orders → change_order_line_items
        └── invoices → payments
        └── jobs → job_photos
                 → inspection_reports → inspection_items → inspection_photos
                 → job_costs
  └── outreach_history

outreach_templates → outreach_runs
prospects → outreach_history
manual_invoices → manual_invoice_items → manual_payments
```

---

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Node.js, PostgreSQL, Prisma ORM, session auth
- **Payments:** Stripe (deposit + progress + final payment flows, webhook handling)
- **Outreach:** Twilio SMS, SMTP email, BullMQ job queues
- **Documents:** PDF generation for estimates, invoices, inspection reports
- **Auth:** Admin session auth + token-authenticated public signing URLs
- **Infra:** Linux VPS, PM2, Nginx, Docker (PostgreSQL)

---

## Engagement Context

This was a forward deployment engagement — scoped, built, and shipped for a live DFW home services operator. Delivered from discovery to production in under 6 weeks. The estimate builder and contract signing flow replaced a manual phone-quote + paper-contract process. The admin panel replaced a combination of spreadsheets and disconnected SaaS tools.

---

## Status

Production. Live and actively used by the client operations team.
