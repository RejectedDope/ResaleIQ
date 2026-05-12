# ResaleIQ eBay Integration

## Purpose

This integration connects ResaleIQ to eBay's official APIs.

Current capabilities:

- search live marketplace inventory
- retrieve pricing comps
- normalize listing data
- prepare future inventory intelligence features
- support future listing-agent workflows

---

## APIs Used

### eBay Browse API

Used for:

- pricing comps
- inventory research
- listing analysis
- future sell-through calculations

### Future APIs Planned

- Taxonomy API
- Inventory API
- Feed API
- Analytics API

---

## Required Environment Variables

Create a `.env.local` file:

```env
EBAY_CLIENT_ID=your-client-id
EBAY_CLIENT_SECRET=your-client-secret
EBAY_ENVIRONMENT=sandbox
```

---

## Test Endpoint

```bash
/api/ebay/search?q=coach+bag
```

---

## Strategic Role Inside ResaleIQ

This integration is NOT just for listing generation.

Primary strategic use:

- dead inventory detection
- pricing intelligence
- market trend analysis
- reseller decision support
- inventory health scoring
- sell-through analysis
- platform optimization

The listing agent should remain a utility layer.
The intelligence layer is the moat.
