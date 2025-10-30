# BlindBid Frontend Development Guide

        ## Identity & Theme
        - **Design Language**: Amber Gallery — primary #D97706, secondary #111827, accent #FCD34D, surface #1F2937, background #050505.
        - **Gradient Token**: linear-gradient(135deg, #F59E0B 0%, #111827 100%)
        - **Font Pairing**: Neue Haas Grotesk + Bodoni Moda

        ## Core Pages & Flows
        ### Route `/` — Curated Drop Landing
                **Purpose**: Show upcoming auctions, highlight artists, and convert visitors into bidders.
                - Hero banner with encrypted activity ticker indicating sealed bid intensity without prices.
- Artist spotlight carousel pulling metadata from the content API.
- CTA cards for 'Preview Lot' and 'Request Private Access' integrating wallet connect.

### Route `/lot/[id]` — Sealed Bid Studio
                **Purpose**: Core bidding workspace where collectors encrypt and submit offers.
                - Bid form enforces pre-approval by checking escrow proof before enabling encryption.
- Encryption summary panel visualises ciphertext creation and handles error states.
- Real-time feed of anonymised bid events (counts only) via Liveblocks channel.

### Route `/curator` — Curator Command Center
                **Purpose**: Operators manage lot lifecycle, monitor reveals, and export compliance logs.
                - Schedule editor with timeline for start/close/extension gates.
- Reveal queue card listing pending decrypt operations with status badges.
- CSV export to share anonymised bidder metrics with partners.

        ## Signature Components
        - **BidEnvelopeForm** — Wizard guiding bidders through collateral check, encryption, and submission.
- **RevealStatusDrawer** — Slides in once auction closes to display reveal progress and settlement receipts.
- **LotAnalyticsHeatmap** — Visualises bid cadence using anonymised counts streamed over websockets.

        ## State & Data
        - React Query manages contract reads; Zustand stores wizard state; Liveblocks streams anonymised bid stats.
        - Smart contract data hydrated via wagmi `readContract` hooks with suspense wrappers.
        - Encryption context stored in React Context to avoid re-initialising the SDK per component.

        ## Encryption Workflow
        Call `initFheInstance`, create keypair bundle, encrypt bid amount with `add64`, attach salt, and submit via wagmi.

        ## Realtime & Telemetry
        - Use Pusher channels to broadcast bid count increments and reveal completions to active viewers.
        - Analytics via PostHog tracking conversion funnels and retention cohorts.
        - Error logging with Sentry capturing encryption or gateway issues.

        ## Testing & Quality
        - Playwright scenario sealing bids from multiple wallets and ensuring UI hides exact prices.
        - Storybook visual tests for bid card states (idle, encrypting, submitted, error).
        - Lighthouse budget ensuring landing performance despite heavy imagery.
