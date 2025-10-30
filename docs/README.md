# BlindBid - Sealed NFT Marketplace


## Vision
BlindBid orchestrates private first-price auctions for high-end NFTs. Collectors encrypt their
maximum willingness to pay so the contract can evaluate winners without exposing bid ladders,
enabling galleries to stage confidential drops while still clearing on-chain.


## Market Fit & Sustainability
- Curated NFT galleries that demand fair price discovery without revealing collector strategies.
- Luxury brands running limited collaborations who require sealed bids to prevent price anchoring.
- Artist collectives who monetise analytics dashboards and white-label auctions for partners.


## FHE-First Architecture
- Bid ciphertexts stored as `euint64` so comparisons run homomorphically inside the fhEVM.
- Running max logic uses `TFHE.gt` to maintain encrypted leaderboards and reveal only post-auction.
- Encrypted reserve price and extension timers prevent sniping while keeping thresholds secret.


## Token & Revenue Model
- Protocol fees on cleared auctions plus branded microsites for partner drops.
- Collector club memberships that unlock early bidding windows and analytics exports.
- Secondary-market royalty routing for partner galleries captured in encrypted settlement flows.


## Contract Modules
- **SealedLotRegistry** — Registers auction lots, encrypted reserve prices, and time windows for each drop. Reserves stored as `euint64` and compared with incoming bids through `TFHE.ge` without ever revealing the threshold.
  - Functions: `createLot`, `updateSchedule`, `cancelLot`
- **EncryptedBidBook** — Holds bidder commitments, encrypted bid amounts, and prevents replay with salted hashes. Uses `TFHE.max` reducer to maintain the winning ciphertext and bidder envelope.
  - Functions: `submitBid`, `increaseBid`, `sealBid`
- **RevealAndSettle** — Triggers gateway reveal, finalizes the NFT transfer, and handles encrypted payout splits. Gateway decrypts the stored winning ciphertext; settlement shares computed on ciphertext before final clear.
  - Functions: `closeLot`, `gatewayCallback`, `claimProceeds`


## Frontend Experience
- **Theme**: Amber Gallery • Primary #D97706 • Accent #FCD34D
- **Font Pairing**: Neue Haas Grotesk + Bodoni Moda
- **Realtime UX**: Use Pusher channels to broadcast bid count increments and reveal completions to active viewers.


## Deployment & Operations
- Deploy contracts with `pnpm hardhat run scripts/deployBlindBid.ts --network zamaTestnet`.
- Seed curator and gateway roles via multisig after deployment; publish addresses to env files.
- Frontend deploys to Vercel with preview branches connected to QA gateway endpoints for smoke tests.


## Roadmap
- Introduce batch auctions for generative series leveraging encrypted clearing prices.
- Add zk-SNARK attestation that bidders escrowed wETH without revealing wallet balances.
- Launch partner analytics dashboard with collector funnels and churn forecasts.


## Partnership Targets
- Luxury NFT custodians offering insured vault settlement.
- Digital art fairs onboarding curated artists.
- DAO treasuries liquidating vault pieces via white-label auctions.
