# BlindBid - Sealed NFT Auction Marketplace

**Confidential first-price auctions for high-end NFTs powered by Zama FHE (Fully Homomorphic Encryption)**

BlindBid enables galleries and collectors to conduct sealed-bid NFT auctions where bid amounts remain encrypted throughout the bidding process. Winners are determined through homomorphic computations on encrypted data, ensuring fair price discovery without revealing collector strategies.

## 🚀 Live Demo

**Deployed Application**: [https://blindbid.vercel.app](https://blindbid.vercel.app)

**Deployed Contract**: [0x823dbCbb01411c3710F17882b3ec440091f9500D](https://sepolia.etherscan.io/address/0x823dbCbb01411c3710F17882b3ec440091f9500D) (Sepolia)

---

## 🎯 Vision

BlindBid orchestrates private first-price auctions for high-end NFTs. Collectors encrypt their maximum willingness to pay so the contract can evaluate winners without exposing bid ladders, enabling galleries to stage confidential drops while still clearing on-chain.

---

## ✨ Key Features

- **🔐 Encrypted Bidding**: All bid amounts encrypted client-side using Zama FHE SDK
- **🏆 Homomorphic Winner Selection**: Winner determined on encrypted data without decryption
- **🔒 Sealed Reserve Prices**: Auction reserves stored as encrypted values
- **⚡ Fail-Closed Security**: Zero-knowledge proofs verify all encrypted inputs
- **🌐 Sepolia Testnet**: Deployed on Ethereum Sepolia for testing
- **📱 Modern UI**: React + TypeScript + Tailwind CSS frontend

---

## 🏗️ Architecture

### FHE-First Design

- **Bid Ciphertexts**: Stored as `euint64` for homomorphic comparisons
- **Running Max Logic**: Uses `TFHE.gt` to maintain encrypted leaderboards
- **ACL Management**: Proper access control with `FHE.allowThis()` and `FHE.allow()`
- **Gateway Integration**: Decryption handled through Zama's relayer gateway

### Contract Modules

1. **SealedLotRegistry**: Manages auction lots with encrypted reserve prices
2. **EncryptedBidBook**: Stores bidder commitments with salted hashes
3. **RevealAndSettle**: Triggers gateway reveal and finalizes NFT transfers

---

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **@fhevm/solidity**: ^0.8.0 (Zama FHE library)
- **Hardhat**: ^2.22.5 (Development framework)
- **@fhevm/hardhat-plugin**: ^0.1.0

### Frontend
- **React**: ^18.3.1
- **TypeScript**: ^5.8.3
- **Vite**: ^5.4.19 (Build tool with COOP/COEP headers)
- **@zama-fhe/relayer-sdk**: 0.2.0 (FHE encryption SDK)
- **Wagmi**: ^1.4.12 (Ethereum interactions)
- **TailwindCSS**: ^3.4.17 + shadcn/ui components

### Network
- **Ethereum Sepolia Testnet** (Chain ID: 11155111)
- **Zama FHE Relayer**: https://relayer.testnet.zama.cloud

---

## 📋 Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **npm** or **yarn**
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH**: For contract deployment and transactions ([Faucet](https://sepoliafaucet.com/))

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd BlindBid

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables**:

```env
# Smart Contract Deployment
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend Configuration
VITE_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_APP_RPC_URL=https://sepolia.drpc.org
VITE_APP_RELAYER_URL=https://relayer.testnet.zama.cloud
VITE_APP_WALLETCONNECT_ID=your_walletconnect_project_id
```

### 3. Compile Smart Contracts

```bash
npm run compile:contracts
```

### 4. Run Tests

```bash
npm run test:contracts
```

### 5. Deploy to Sepolia

```bash
# Deploy contract
npm run deploy:sepolia

# Verify on Etherscan (after deployment)
npm run verify:sepolia

# Export ABI for frontend
npm run export:abi
```

### 6. Start Frontend Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:8080`

---

## 📝 Contract Functions

### Core Functions

#### `createLot`
```solidity
function createLot(
    string calldata metadataURI,
    uint64 startTime,
    uint64 endTime,
    externalEuint64 encryptedReserve,
    bytes calldata reserveProof
) external returns (uint256 lotId)
```
Creates a new auction lot with encrypted reserve price.

#### `submitBid`
```solidity
function submitBid(
    uint256 lotId,
    externalEuint64 encryptedBid,
    bytes calldata inputProof,
    bytes32 saltHash
) external
```
Submits an encrypted bid with salt commitment.

#### `closeLot`
```solidity
function closeLot(uint256 lotId) external
```
Closes bidding and requests reveal from gateway (curator only).

#### `settleReveal`
```solidity
function settleReveal(
    uint256 lotId,
    uint32 winningIndex,
    uint64 clearWinningBid,
    address bidder
) external
```
Gateway callback to finalize winner and revealed amount.

### View Functions

- `getLot(uint256 lotId)`: Returns lot details
- `getBid(uint256 lotId, address bidder)`: Returns bid envelope
- `getAllLotIds()`: Returns all created lot IDs

---

## 🎨 Frontend Usage

### Connecting Wallet

1. Click "Connect Wallet" in the header
2. Select MetaMask or WalletConnect
3. Ensure you're connected to Sepolia network

**Note**: Coinbase Wallet connector is disabled per FHE development guidelines.

### Submitting Encrypted Bid

1. Navigate to auction page
2. Enter bid amount in ETH
3. System automatically:
   - Generates random salt
   - Encrypts bid using Zama FHE SDK
   - Creates zero-knowledge proof
   - Submits transaction to blockchain

4. Save the salt value shown in the success message (needed for proof of ownership)

### Curator Actions

- Create new auction lots with encrypted reserves
- Close auctions to trigger winner reveal
- View anonymized bid counts

---

## 🔒 Security Features

### Fail-Closed Model
- All encrypted inputs validated with zero-knowledge proofs
- Transactions revert if proof verification fails
- No plaintext bid data ever stored on-chain

### Access Control
- ACL permissions managed via `FHE.allowThis()` and `FHE.allow()`
- Only authorized addresses can access encrypted values
- Gateway operator set by contract owner

### Salt Protection
- Prevents bid replay attacks
- Salt hashed on-chain with keccak256
- Each salt can only be used once per auction

---

## 🧪 Testing

### Run All Contract Tests
```bash
npm run test:contracts
```

### Test Coverage
- Lot creation and validation
- Encrypted bid submission
- Auction closing and reveal
- Gateway settlement
- Access control and permissions
- Error handling and edge cases

### Gas Reporting
```bash
REPORT_GAS=true npm run test:contracts
```

---

## 📦 Deployment Workflow

### 1. Local Testing
```bash
npm run compile:contracts
npm run test:contracts
```

### 2. Deploy to Sepolia
```bash
# Ensure .env is configured
npm run deploy:sepolia
```

Contract address will be saved in `deployments/BlindBidAuction-sepolia.json`

### 3. Verify Contract
```bash
npm run verify:sepolia
```

### 4. Update Frontend Config
```bash
# Update .env with deployed contract address
VITE_APP_CONTRACT_ADDRESS=0x<deployed_address>

# Export ABI
npm run export:abi
```

### 5. Build Frontend
```bash
npm run build
```

### 6. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📁 Project Structure

```
BlindBid/
├── contracts/
│   └── BlindBidAuction.sol       # Main FHE auction contract
├── scripts/
│   ├── deploy-sepolia.cjs         # Deployment script
│   ├── verify-sepolia.cjs         # Contract verification
│   └── export-abi.cjs             # ABI export utility
├── test/
│   └── BlindBidAuction.test.js   # Comprehensive test suite
├── src/
│   ├── components/
│   │   ├── auction/               # Auction-specific components
│   │   ├── landing/               # Landing page components
│   │   ├── layout/                # Layout components
│   │   └── ui/                    # shadcn/ui components
│   ├── providers/
│   │   ├── FheProvider.tsx        # FHE SDK initialization
│   │   └── Web3Provider.tsx       # Wagmi configuration
│   ├── hooks/
│   │   └── useLots.ts             # Custom React hooks
│   ├── pages/
│   │   ├── Landing.tsx
│   │   └── Auction.tsx
│   ├── abi/
│   │   └── BlindBidAuction.json  # Generated contract ABI
│   └── config/
│       └── env.ts                 # Environment validation
├── hardhat.config.cjs             # Hardhat configuration
├── vite.config.ts                 # Vite with COOP/COEP headers
├── package.json
└── .env.example                   # Environment template
```

---

## 🔧 Development Scripts

```bash
# Smart Contract Development
npm run compile:contracts    # Compile Solidity contracts
npm run test:contracts       # Run contract tests
npm run deploy:sepolia       # Deploy to Sepolia
npm run verify:sepolia       # Verify on Etherscan
npm run export:abi           # Export ABI to frontend

# Frontend Development
npm run dev                  # Start development server
npm run build                # Production build
npm run preview              # Preview production build
npm run lint                 # Run ESLint
```

---

## 🐛 Troubleshooting

### FHE SDK Initialization Error
**Problem**: `Cannot find module '@zama-fhe/relayer-sdk/bundle'`

**Solution**: Ensure correct import path in `FheProvider.tsx`:
```typescript
import { createInstance, initSDK, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";
```

### COOP/COEP Headers Not Set
**Problem**: `SharedArrayBuffer is not defined`

**Solution**: Verify `vite.config.ts` includes headers:
```typescript
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  },
}
```

### Contract Deployment Failed
**Problem**: Transaction reverted during deployment

**Solutions**:
- Ensure sufficient Sepolia ETH in deployer account
- Check `SEPOLIA_RPC_URL` is accessible
- Verify `DEPLOYER_PRIVATE_KEY` format (without '0x' prefix)

### Type Errors in Frontend
**Problem**: TypeScript errors with contract types

**Solution**: Re-export ABI after contract changes:
```bash
npm run export:abi
```

---

## 📚 Resources

- **Zama fhEVM Docs**: https://docs.zama.ai/fhevm
- **FHE Developer Guide**: [docs/FHE_COMPLETE_GUIDE_FULL_CN.md](../../docs/FHE_COMPLETE_GUIDE_FULL_CN.md)
- **Hardhat Docs**: https://hardhat.org/docs
- **Wagmi Docs**: https://wagmi.sh/
- **Sepolia Faucet**: https://sepoliafaucet.com/

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Zama** for the fhEVM and FHE SDK
- **Ethereum Foundation** for Sepolia testnet
- **Hardhat** team for excellent development tools
- **shadcn/ui** for beautiful UI components

---

## 📧 Contact & Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Zama FHE Technology**
