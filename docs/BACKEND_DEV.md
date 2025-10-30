# BlindBid Backend Development Guide

        ## Contract System
        ### SealedLotRegistry
Registers auction lots, encrypted reserve prices, and time windows for each drop.

- **FHE Logic**: Reserves stored as `euint64` and compared with incoming bids through `TFHE.ge` without ever revealing the threshold.
- **Key Functions**: `createLot`, `updateSchedule`, `cancelLot`

### EncryptedBidBook
Holds bidder commitments, encrypted bid amounts, and prevents replay with salted hashes.

- **FHE Logic**: Uses `TFHE.max` reducer to maintain the winning ciphertext and bidder envelope.
- **Key Functions**: `submitBid`, `increaseBid`, `sealBid`

### RevealAndSettle
Triggers gateway reveal, finalizes the NFT transfer, and handles encrypted payout splits.

- **FHE Logic**: Gateway decrypts the stored winning ciphertext; settlement shares computed on ciphertext before final clear.
- **Key Functions**: `closeLot`, `gatewayCallback`, `claimProceeds`

        ## Storage Layout
        - `mapping(uint256 => EncryptedLot)` with encrypted reserve and encrypted extension threshold.
- `mapping(uint256 => mapping(address => BidEnvelope))` storing ciphertext, salt hash, and escrow proof.
- `EncryptedSettlement` struct caching encrypted seller/curator revenue splits until reveal completes.

        ## Gateway & Relayer Coordination
        - Use dedicated `BlindBidGateway` relayer that listens for `RevealRequested` events and submits decrypt proofs.
- Post-reveal hook validates signature and writes cleartext winner + price via `settleReveal`.
- Operators rotate keys via multisig-controlled `updateGatewayOperator` to preserve trust minimisation.

        ## Offchain Services
        - Auction analytics service (Next.js API route) streams anonymised activity for the landing page.
- Webhook worker posts sale summaries into partner CRM tools once reveals settle.
- Optional Chainlink Functions check escrow vault balances before allowing high-value bids.

        ## Testing Strategy
        - Hardhat tests covering encrypted max selection, escrow validation, and reveal flows.
- Property-based fuzzing ensures encrypted comparisons correctly reject lower bids.
- Gateway integration test mocking successful and failed decrypt callbacks.

        ## Deployment Playbook
        - Deploy contracts with `pnpm hardhat run scripts/deployBlindBid.ts --network zamaTestnet`.
- Seed curator and gateway roles via multisig after deployment; publish addresses to env files.
- Frontend deploys to Vercel with preview branches connected to QA gateway endpoints for smoke tests.
