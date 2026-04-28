# ResaleIQ (Rejected Economy)

ResaleIQ is an MVP web app for reseller listing intelligence. It helps users evaluate listing compliance, profit quality, and dead inventory risk before and after posting.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Local deterministic logic and mock data

## Install
```bash
npm install
```

## Run
```bash
npm run dev
```
Open http://localhost:3000.

## MVP Pages
- `/` Dashboard with KPI cards.
- `/analyze` New Item Analysis form with scoring + listing outputs.
- `/compliance` Compliance checker with required fixes.
- `/profit` Profit calculator with ROI/margin and warning state.
- `/dead-listings` Dead listing detector table using sample inventory.

## Where scoring logic lives
- Compliance: `lib/compliance.ts`
- Profit and profit scoring: `lib/profit.ts`
- Listing generation and aggregate analysis: `lib/listingGenerator.ts`
- Dead listing risk and action mapping: `lib/deadListing.ts`
- Platform recommendation logic: `lib/platformRecommendation.ts`
- Sample inventory: `lib/sampleData.ts`
- Shared TypeScript models: `lib/types.ts`

## How to test each page
1. Dashboard (`/`)
   - Verify all five KPI cards render.
2. New Item Analysis (`/analyze`)
   - Submit with empty required fields and check compliance score drops.
   - Enter a full listing and verify generated titles, description, and keywords.
   - Confirm pricing outputs:
     - Fast sale = target * 0.85
     - Recommended = target
     - Max value = target * 1.2
3. Compliance Checker (`/compliance`)
   - Use fashion category with missing size/condition and verify deductions.
   - Enter non-standard size to trigger size-format penalty.
4. Profit Calculator (`/profit`)
   - Verify output math and weak profit warning behavior.
5. Dead Listings (`/dead-listings`)
   - Check rows display risk score, top issue, and recommended action from deterministic rules.

## Future roadmap notes
### eBay API integration (future)
- Replace static fee assumptions with endpoint-driven fee category mappings.
- Sync sold comps for better platform and price recommendations.
- Use listing status APIs for real dead-inventory telemetry.

### AI / image analysis (future)
- Add image quality scoring (blur/background/object coverage).
- Add AI-assisted attribute extraction with human review gate.
- Add title/description variant testing with deterministic fallbacks.

## Safety posture (MVP)
- No live marketplace API calls.
- No production credentials.
- No paid services required.
- No authentication overbuild in V1.
