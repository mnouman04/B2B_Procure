# Architecture notes

A deeper look at how the platform is put together, aimed at whoever picks this
codebase up next.

---

## 1. Why this shape

The brief describes a workflow, not a catalogue: *understand the request →
match suppliers → request prices → compare offers → verify specifications →
recommend the best offer*. Every one of those steps is a state transition on an
RFQ, so the code is organised around that lifecycle rather than around CRUD.

Two consequences follow:

- **The RFQ is the aggregate root.** Quotations, purchase orders, deliveries and
  conversations all hang off it. Its status is the single source of truth for
  what the parties are allowed to do next.
- **Transitions live in services, never in controllers or the UI.** Awarding a
  quotation must, atomically: accept the winner, reject every rival, close the
  RFQ, issue a purchase order and record the savings. That belongs in one
  method (`order.service.js → awardAndIssuePo`), not spread across handlers.

---

## 2. Layer contract

```
routes/         Declares the URL, the guards and the request schema. No logic.
controllers/    Adapt HTTP ↔ service. Read req, call one service, render.
services/       All business rules. May call other services and repositories.
repositories/   The only code that imports a Mongoose model.
models/         Schema, invariants, derived fields, pre-save hooks.
```

Things that would violate the contract, and where they are handled instead:

| Temptation | Correct home |
|---|---|
| Querying inside a controller | a service method |
| `Model.find()` inside a service | a repository method |
| Computing totals in the UI | `Quotation` pre-save hook (the UI mirrors it only for live preview) |
| Sending a notification inside `awardAndIssuePo` | an event listener |

---

## 3. Data model

```
User ──belongs to──▶ Company        (buyers)
User ──belongs to──▶ Supplier       (supplier staff)

Company ──1..n──▶ RFQ ──1..n──▶ Quotation ──1..1──▶ PurchaseOrder
                   │                 │                    │
                   │                 └── Supplier ◀───────┘
                   └── invitedSuppliers[] (supplier + matchScore + distanceKm)

Supplier ──1..n──▶ Product
Supplier ──1..n──▶ Review  ◀── written by a Company after delivery
Conversation ──1..n──▶ Message      (optionally scoped to an RFQ or PO)
Notification ──▶ User
```

### Notable decisions

- **`invitedSuppliers` stores a snapshot** of the match score and distance at
  publish time. Supplier ratings change; the buyer needs to see why a supplier
  was invited *then*.
- **Quotation totals are derived, not submitted.** A `pre('save')` hook
  computes line totals, subtotal, VAT, grand total and the weighted quality
  compliance, so a client cannot post inconsistent numbers.
- **Purchase orders carry their own `timeline[]`.** "Orders & Delivery" is a
  view over that array, not a separate collection.
- **Document numbers are atomic.** `utils/sequence.js` uses a counters
  collection with `findByIdAndUpdate($inc, upsert)` so concurrent writers never
  produce `RFQ-2026-0042` twice.
- **Ratings are always recomputed from `Review` documents.** There is no
  hand-maintained average that can drift; the seed back-fills real reviews for
  the same reason.

---

## 4. Status machines

**RFQ**

```
draft ──publish──▶ published ──first quote──▶ quoted ──award──▶ awarded
  │                    │                        │
  └──delete            └────────close───────────┴──▶ closed / cancelled
```

**Quotation**

```
draft ──submit──▶ submitted ──▶ shortlisted ──▶ accepted
                      │              │
                      ├──────────────┴──▶ rejected
                      └──▶ withdrawn
```

**Purchase order** — the brief's flow, enforced one step at a time:

```
issued → approved → processing → shipped → delivered → completed
   (buyer)  (supplier) (supplier)  (supplier)  (buyer)
```

`order.service.js → #assertTransition` rejects skipped steps, backward moves,
and steps taken by the wrong party. Cancellation is allowed until the order
ships.

---

## 5. Scoring

### Supplier matching (pre-quotation)

Features are normalised to `0..1`, then weighted by the active strategy:

| Feature | Derivation |
|---|---|
| `category` | share of the RFQ's category + sub-category the supplier covers |
| `proximity` | great-circle distance, `0 km → 1.0`, `1000 km → 0.0`; floored at `0.7` when the city is in `coverageAreas` |
| `rating` | `rating.average / 5` |
| `reliability` | `onTimeDeliveryRate / 100` |
| `speed` | days available ÷ the supplier's typical lead time, capped at 1 |
| `price` | from `priceIndex` (100 = market average; lower is cheaper) |
| `verified`, `compliance`, `capacity`, `responsiveness` | direct normalisations |

### Quotation scoring (post-quotation)

Scored **relative to the peer set** on the same RFQ, weighted
`price 35 · compliance 30 · delivery 20 · rating 10 · warranty 5`. The cheapest
offer gets full price marks; the fastest gets full delivery marks. Badges
(`best_price`, `best_match`, `fastest`) fall out of the same pass and drive the
green highlighting on Compare Quotations.

This is what makes the platform "not simply pick the cheapest" — the brief's
central requirement.

---

## 6. Events

```js
eventBus.publish(DomainEvents.QUOTATION_SUBMITTED, { quotation, rfq, supplier });
```

Publication is `setImmediate`-deferred and every listener is wrapped in a
try/catch, so a failing side effect can never break the request that caused it.

| Event | Listener effect |
|---|---|
| `rfq.published` | notify every invited supplier with its match score |
| `quotation.submitted` | notify the buyer; bump counters; re-score the peer set |
| `quotation.accepted` / `rejected` | notify the supplier; increment win stats |
| `po.issued` / `po.statusChanged` | notify both parties |
| `message.sent` | notify recipients |
| `supplier.verificationChanged` | notify the supplier's users |

---

## 7. Transactions

`utils/transaction.js` runs work inside a MongoDB transaction where the
deployment supports one (replica set / Atlas) and falls back to a sequential
run on a standalone server, detected once and cached. The same service code
therefore works in every environment — important because the zero-setup
embedded database is a standalone.

---

## 8. Frontend structure

- **`components/ui/`** is a closed design system. Feature code composes it and
  does not write raw colour classes.
- **`features/<area>/`** holds containers: they fetch, hold state and compose
  `ui/` primitives.
- **`hooks/useApi`** gives every screen the same `{ data, meta, loading, error,
  refresh }` shape, so loading skeletons and empty states are consistent.
- **`api/endpoints.js`** is the only place URLs are written.
- **Redux** holds just session, notifications and UI flags. Screen-level data is
  fetched per route — simpler than caching everything globally, and correct for
  a workflow app where freshness matters.

### RTL

Layout mirroring is achieved with logical properties, not a second stylesheet:
`ms-auto`, `pe-3`, `start-0`, `border-s`. A `.rtl-flip` utility mirrors
directional icons. The result is that one component tree renders both the
English and Arabic mockups.

---

## 9. What I would do next

Deliberately out of scope for this build, in rough priority order:

1. **Real-time** — swap the notification poll for Socket.IO; the event bus is
   already the right seam.
2. **Automated tests** — the service layer is pure enough to test directly;
   `createApp()` returns an unbound app for supertest.
3. **File storage** — the upload middleware is written as an adapter, so an S3
   implementation slots in without touching controllers.
4. **Background jobs** — expiring stale quotations, deadline reminders.
5. **Full audit trail** — who changed what, alongside the existing PO timeline.
6. **Code-splitting** — the bundle is ~930 KB; route-level `React.lazy` would
   cut first paint substantially.
