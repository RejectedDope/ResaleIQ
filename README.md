# ResaleIQ — Rejected Economy

## Overview

ResaleIQ is a reseller compliance, profit, and listing intelligence web app built for sellers on eBay, Poshmark, Facebook Marketplace, Mercari, and other resale platforms.

This is not a generic listing generator.

The product is designed to answer:

- Should I sell this?
- Where should I sell it?
- How much profit is actually left after fees?
- Is this listing stale, overpriced, or hurting cash flow?
- What should I relist, reprice, crosslist, or liquidate?

Core focus:

**Margin protection first. Listing generation second.**

---

## MVP Features

### Dashboard
- Listings analyzed
- High-risk listings
- Dead inventory alerts
- Estimated profit leaks
- Average listing health score
- Urgent recovery actions
- Dead Inventory Audit paid offer CTA

### New Item Analysis
- Compliance score
- Profit score
- Visibility score
- Pricing strategy
- Platform recommendation
- Listing output generation
- Recovery recommendations

### Compliance Checker
- Missing field detection
- Listing compliance scoring
- Risk levels
- Required fixes

### Profit Calculator
- Net profit
- ROI
- Margin
- Break-even pricing
- Weak profit warnings

### Dead Listing Detector
- Dead listing risk scoring
- Relist / reprice / crosslist / liquidate recommendations

---

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- Local mock data
- No paid APIs required for V1

---

## Install

```bash
npm install
```

---

## Run Locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Scoring Logic

### Compliance Logic

Located in:

```text
/lib/compliance.ts
```

Starts at 100 and deducts points for:

- missing condition
- missing size
- non-standard size format
- missing brand
- missing color
- missing material
- regulated item documentation gaps

---

### Profit Logic

Located in:

```text
/lib/profit.ts
```

Calculates:

- gross sale
- total fees
- promoted fees
- refund reserve
- net profit
- ROI
- margin
- break-even price

---

### Dead Listing Logic

Located in:

```text
/lib/deadListing.ts
```

Scores stale inventory based on:

- listing age
- compliance weakness
- weak profit
- weak title
- missing condition
- platform mismatch

---

## Monetization Path

### First Paid Offer

## Dead Inventory Audit

Starting at $97

Designed to convert free users into paid customers quickly.

Focus:

- stale inventory recovery
- hidden profit leaks
- pricing mistakes
- relist and liquidation strategy

Free tool → paid audit → recurring subscription

---

## Future Phase 2

### Planned API Integrations

- eBay sold comps
- eBay listing enhancement
- marketplace crosslisting workflows
- inventory sync

### Planned AI Features

- photo upload → item recognition
- resale value estimation from images
- authenticity support workflows
- buy / skip sourcing mode

### Subscription Expansion

- reseller dashboard
- recurring inventory audits
- premium margin protection alerts
- white-label reseller systems

---

## Principle

Do not optimize for prettier listings.

Optimize for:

**better decisions and stronger margin protection.**
