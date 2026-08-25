# PROCURIO · توريد — Smart B2B Procurement Platform

A MERN implementation of the Smart B2B Sourcing brief: large companies post a
requirement, the platform matches verified suppliers, collects quotations,
compares them side by side, and carries the winner through to a purchase order
and delivery.

> The platform does not simply pick the cheapest offer — it presents the best
> overall value across **price + specifications + quality + delivery time +
> location**.

---

## Contents

- [What is built](#what-is-built)
- [Screens](#screens)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Project layout](#project-layout)
- [Architecture](#architecture)
- [Design patterns used](#design-patterns-used)
- [The matching engine](#the-matching-engine)
- [API reference](#api-reference)
- [Design system](#design-system)
- [Internationalisation & RTL](#internationalisation--rtl)
- [Configuration](#configuration)
- [Business model](#business-model)

---

## What is built

All fifteen pages from the brief are implemented as working screens backed by
real API endpoints:

| # | Page (brief) | Where it lives |
|---|---|---|
| 1 | Home — search, Request a Quote, top categories & suppliers | `/` |
| 2 | Company Registration | `/register` (and `/register/supplier`) |
| 3 | Buyer Dashboard | `/buyer` |
| 4 | **Create RFQ** — 4-step wizard | `/buyer/rfqs/new` |
| 5 | Supplier Matching | `/buyer/rfqs/:id/matches` |
| 6 | Compare Quotations | `/buyer/rfqs/:id/compare` |
| 7 | Supplier Profile | `/suppliers/:slug` |
| 8 | Supplier Dashboard | `/supplier` |
| 9 | Submit Quotation | `/supplier/rfqs/:id/quote` |
| 10 | Purchase Orders | `/buyer/orders` · `/supplier/orders` |
| 11 | Orders & Delivery — Approved → Processing → Shipped → Delivered | `/buyer/deliveries` |
| 12 | Messages | `/buyer/messages` · `/supplier/messages` |
| 13 | Vendor Verification — CR, VAT, IBAN, accreditations | `/supplier/verification` · `/admin/verification` |
| 14 | Procurement Analytics | `/buyer/analytics` |
| 15 | Admin Dashboard — companies, suppliers, requests, commissions, reports | `/admin` |

Beyond the page list, the brief's follow-on features are in place too:
**e-negotiation** (quotation revisions with a full trail), **supplier
evaluation** (post-delivery ratings that feed back into matching), and
**delivery + invoice tracking**.

### The end-to-end flow, working

```
Buyer posts an RFQ            →  Ready-mix concrete · 500 m³ · Grade C40 · Jazan · 7 days
Matching engine runs          →  "We found 4 verified suppliers"  (97% · 77% · 76%)
RFQ published                 →  invitations + notifications to matched suppliers
Suppliers submit quotations   →  priced per line, with spec-compliance per item
Compare Quotations            →  Best Price / Best Match / Fastest badges, savings figure
Buyer awards                  →  PO issued, rivals auto-declined, RFQ closed
Order tracked                 →  Approved → Processing → Shipped → Delivered → Completed
Buyer rates the supplier      →  rating recomputed, feeds the next match
```

---

## Screens

The UI is a faithful rebuild of the mockups at the end of the brief — the same
navy/gold palette, the same layouts, and the same Arabic RTL variant. Both
languages ship: the header's language switch flips the entire application,
including the sidebar, tables, charts and icon direction.

---

## Quick start

**Requirements:** Node 18.18+. MongoDB is optional — see below.

```bash
# 1. Install everything (root + backend + frontend)
npm run install:all

# 2. Seed the demo data (suppliers, RFQs, quotations, orders, reviews)
npm run seed

# 3. Run the API and the web app together
npm run dev
```

- Web app → <http://localhost:5173>
- API → <http://localhost:5000/api/v1>

### About the database

`backend/.env` points at `mongodb://127.0.0.1:27017/procurio`. If that server
is not reachable in development, the API automatically starts an **embedded
MongoDB** whose data files live in `.mongo-data/`, so the platform runs with
zero setup and still keeps its data between restarts.

Only one process can hold the embedded data directory at a time, so **stop the
API before running `npm run seed`**. Point `MONGO_URI` at a real MongoDB (local
or Atlas) and that restriction disappears.

---

## Demo accounts

All use the password **`Procurio2026`**.

| Role | Email | Organisation |
|---|---|---|
| Buyer | `buyer@procurio.sa` | Al Falah Construction Co. |
| Buyer | `khalid@northerndev.sa` | Northern Development Group |
| Supplier | `supplier1@procurio.sa` | BuildPro Supplies (verified) |
| Supplier | `supplier2@procurio.sa` | StoneTech Manufacturing (verified) |
| Supplier | `pending@procurio.sa` | Desert Rock Quarries (awaiting verification) |
| Admin | `admin@procurio.sa` | Platform administrator |

The login screen lists these and fills the form on click.

---

## Project layout

```
B2B/
├── backend/                 Express + MongoDB API
│   └── src/
│       ├── config/          env, logger, database (singletons), constants
│       ├── models/          Mongoose schemas — the domain layer
│       ├── repositories/    Repository pattern over Mongoose
│       ├── services/        Business logic (the only place rules live)
│       ├── strategies/      Matching + quotation-scoring strategies
│       ├── events/          Domain event bus and its listeners
│       ├── controllers/     Thin HTTP adapters
│       ├── routes/          Route tables + middleware wiring
│       ├── middleware/      auth, RBAC, validation, uploads, errors
│       ├── validators/      Zod request schemas
│       ├── utils/           ApiError, responses, tokens, sequences, geo
│       └── seed/            Demo data
└── frontend/                React + Vite SPA
    └── src/
        ├── api/             axios client + one module per resource
        ├── store/           Redux Toolkit slices
        ├── i18n/            English + Arabic dictionaries, RTL provider
        ├── components/      ui/ (design system), layout/, common/, charts/
        ├── features/        One folder per domain area
        ├── hooks/           useApi, useMutation, useDebounced
        └── utils/           formatting helpers
```

---

## Architecture

The backend is strictly layered, and each layer may only talk to the one below
it:

```
HTTP request
   ↓  routes/          route table, guards, validation
   ↓  middleware/      authenticate → authorize → validate → handler
   ↓  controllers/     parse request, call a service, render a response
   ↓  services/        business rules, transactions, publish domain events
   ↓  repositories/    the only code that knows about Mongoose
   ↓  models/          schemas, invariants, derived fields
MongoDB
```

Two rules keep it honest:

- **Controllers hold no logic.** They read `req`, call one service method and
  hand the result to a response helper.
- **Services never touch a Model.** They go through repositories, so swapping
  the persistence layer or adding caching is a change in one place.

Side effects hang off a **domain event bus** rather than being wired into the
business logic. When a quotation is submitted, `quotation.service` publishes
`QUOTATION_SUBMITTED`; a listener creates the buyer's notification. Adding an
email or SMS channel later means adding a listener, not editing the service.

---

## Design patterns used

| Pattern | Where | Why |
|---|---|---|
| **Singleton** | `config/database.js`, `config/logger.js`, `events/EventBus.js` | One connection, one log sink, one bus |
| **Repository** | `repositories/BaseRepository.js` + per-entity repos | Isolates Mongoose behind an interface |
| **Service layer** | `services/*.service.js` | Business rules live in exactly one place |
| **Strategy** | `strategies/MatchingStrategy.js` | Best Match / Best Price / Fastest / Nearest re-weight the same features |
| **Factory** | `strategies/StrategyFactory.js` | Resolves a request parameter into a strategy instance |
| **Observer** | `events/EventBus.js` + `events/listeners.js` | Notifications and counters decoupled from business logic |
| **Chain of responsibility** | Express middleware | `authenticate → authorize → validate → controller` |
| **Decorator** | `utils/asyncHandler.js` | Funnels async rejections into the error middleware |
| **Facade** | `services/analytics.service.js` | One entry point over many aggregations |
| **Adapter** | `middleware/upload.middleware.js` | Storage details behind a stable attachment shape |
| **Provider / Container-Presentational / Custom hooks** | Frontend | `I18nProvider`, feature containers over a dumb `ui/` kit, `useApi` |

---

## The matching engine

`MatchingStrategy` turns a supplier into a normalised feature vector against a
given RFQ — category fit, proximity, rating, on-time reliability, spec
compliance, verification, lead-time feasibility, price index, capacity and
responsiveness. Each concrete strategy weights those features differently:

```js
// Balanced default, behind the "Best Match" sort
get weights() {
  return { category: 30, proximity: 15, rating: 15, reliability: 12,
           compliance: 8, verified: 8, speed: 6, price: 6 };
}
```

Changing the sort order on the Supplier Matching screen swaps the strategy —
the service layer is untouched. Registering a new one is a single line in
`StrategyFactory`.

`QuotationScorer` does the same job for offers, but **relative to their peers**:
the cheapest quote earns full price marks, the fastest earns full delivery
marks, and the three headline badges (`Best Price`, `Best Match`, `Fastest`)
are awarded from the same pass.

---

## API reference

Base URL: `/api/v1`. All responses share one envelope:

```jsonc
// success
{ "success": true, "message": "OK", "data": {}, "meta": { } }
// failure
{ "success": false, "message": "…", "code": "VALIDATION_ERROR", "errors": [] }
```

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register/company` · `/auth/register/supplier` · `/auth/login` · `/auth/refresh` · `/auth/logout` · `GET|PATCH /auth/me` |
| Catalog | `GET /catalog/categories` · `/categories/popular` · `/search` · `/reference` |
| Suppliers | `GET /suppliers` · `/suppliers/top-rated` · `/suppliers/:idOrSlug` · `GET|PATCH /suppliers/me` · `POST /suppliers/me/documents` · `POST /suppliers/me/submit-verification` · `POST /suppliers/:id/verification` *(admin)* |
| RFQs | `GET|POST /rfqs` · `GET|PATCH|DELETE /rfqs/:id` · `GET /rfqs/:id/matches` · `POST /rfqs/:id/publish` · `GET /rfqs/:id/comparison` · `POST /rfqs/:id/close` |
| Quotations | `GET|POST /quotations` · `GET|PATCH /quotations/:id` · `POST /quotations/:id/revise` · `/withdraw` · `/shortlist` · `/reject` |
| Orders | `GET|POST /orders` · `GET /orders/:id` · `PATCH /orders/:id/status` · `POST /orders/:id/cancel` · `/review` |
| Messages | `GET|POST /messages/conversations` · `GET|POST /messages/conversations/:id/messages` |
| Notifications | `GET /notifications` · `/unread-count` · `POST /:id/read` · `/read-all` |
| Analytics | `GET /analytics/platform` · `/buyer/dashboard` · `/buyer/procurement` · `/supplier/dashboard` · `/admin/dashboard` |
| Admin | `GET /admin/companies` · `/suppliers` · `/verification-queue` · `/users` · `/rfqs` · `/commissions` · category CRUD |
| Uploads | `POST /uploads/{rfq,quotation,verification,logo,message}` |

**Security:** JWT access + refresh tokens (httpOnly cookies *and* bearer
headers), bcrypt hashing, role-based guards, ownership checks on every record,
Zod validation on every request body, Helmet, CORS allow-list, rate limiting,
and upload type/size restrictions.

---

## Design system

Tokens are lifted directly from the mockups and defined once in
`frontend/tailwind.config.js`:

| Token | Value | Use |
|---|---|---|
| `navy-900` / `navy-950` | `#0B1B3A` / `#071429` | Header, sidebar, primary buttons |
| `gold-400` / `gold-500` | `#E9C46A` / `#DFAE4E` | Calls to action, badges, active icons |
| `canvas` | `#F5F7FA` | Page background |
| `line` | `#E6EAF1` | Card borders and dividers |
| `success` | `#16A34A` | Savings, match scores, winning cells |

Typography is **Inter** for Latin and **IBM Plex Sans Arabic** for Arabic. The
`components/ui/` folder is the whole kit — `Button`, `Badge`, `Card`, `Field`,
`Table`, `Modal`, `Tabs`, `Stepper`, `Dropdown`, `ScoreRing`, `Rating` — so
every screen inherits the same spacing, radii and shadows.

---

## Internationalisation & RTL

`I18nProvider` flips `dir` on `<html>`, and the layout follows because
components use **logical** utilities (`ms`/`me`/`ps`/`pe`, `start`/`end`)
instead of hard-coded left/right. Directional icons carry `rtl-flip`. Content
stored in both languages (`name` / `nameAr`) is resolved through `pick()`.

---

## Configuration

`backend/.env` (see `.env.example`):

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/procurio` | Local or Atlas |
| `USE_EMBEDDED_DB` | `false` | Force the embedded MongoDB |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | **Change for production** |
| `VAT_RATE` | `0.15` | Saudi VAT, applied to quotations and POs |
| `PLATFORM_COMMISSION_RATE` | `0.02` | Commission recorded per awarded PO |
| `MAX_UPLOAD_MB` | `10` | Per-file upload limit |

---

## Business model

The brief leaves open who pays. All three candidate models are supported by the
data model, and the Pricing page states them side by side:

1. **Buyer subscription** — the buying company pays for sourcing and analytics.
2. **Supplier membership** — suppliers pay to receive genuine purchase requests.
3. **Transaction commission** — `PLATFORM_COMMISSION_RATE` is recorded on every
   awarded purchase order and reported on the Admin → Commissions screen.

Switching between them is a configuration and billing decision, not a rewrite.

### A note on the LinkedIn point in the brief

The brief treats LinkedIn as a **sales channel** for finding procurement
decision-makers, and explicitly advises against unauthorised scraping. Nothing
in this codebase scrapes LinkedIn; lead sourcing is left to official tools and
licensed B2B data providers, as the brief recommends.
