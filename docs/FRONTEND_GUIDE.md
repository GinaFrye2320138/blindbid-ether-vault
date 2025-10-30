# BlindBid Frontend Development Guide

> **Complete guide for BlindBid's optimized frontend with Wagmi, FHE SDK, and professional UX**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Wallet Integration](#wallet-integration)
4. [FHE SDK Integration](#fhe-sdk-integration)
5. [Component Structure](#component-structure)
6. [User Flow](#user-flow)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Provider Hierarchy

The application uses a layered provider architecture (order matters!):

```
App
├── Web3Provider (Wagmi)          ← Wallet connection
│   ├── FheProvider (Zama SDK)    ← FHE encryption
│   │   ├── QueryClientProvider   ← Data fetching
│   │   │   ├── TooltipProvider   ← UI tooltips
│   │   │   │   └── Routes        ← Application pages
```

**Why this order?**
- `Web3Provider` must be first to establish wallet connection
- `FheProvider` requires wallet address for encryption context
- `QueryClientProvider` manages server state (contract reads)
- `TooltipProvider` provides UI utilities

### Key Features Implemented

✅ **Wallet Management**
- MetaMask integration via Wagmi
- WalletConnect support (mobile wallets)
- **Coinbase Wallet DISABLED** (per FHE guidelines)
- Network validation (Sepolia-only)
- Auto-reconnect on page load

✅ **FHE Encryption**
- WASM-based client-side encryption
- Zero-knowledge proof generation
- Multi-threaded encryption (performance optimized)
- Comprehensive error handling

✅ **User Experience**
- Professional wallet connection modal
- Responsive design (mobile/tablet/desktop)
- Real-time FHE initialization status
- Network switching prompts
- Toast notifications

✅ **Security**
- COOP/COEP headers for SharedArrayBuffer
- No plaintext bid data sent to blockchain
- Salt-based replay protection
- Proper ACL management

---

## 🛠️ Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    // Web3 & Wallet
    "wagmi": "^1.4.12",           // Wallet integration
    "viem": "^2.21.0",            // Ethereum interactions
    "ethers": "^6.13.0",          // Contract ABI encoding

    // FHE Encryption
    "@zama-fhe/relayer-sdk": "0.2.0",  // MUST use 0.2.0

    // Frontend Framework
    "react": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@tanstack/react-query": "^5.83.0",

    // UI Components
    "@radix-ui/react-*": "latest",  // Headless UI primitives
    "tailwindcss": "^3.4.17",       // Styling
    "framer-motion": "^12.23.24",   // Animations
    "lucide-react": "^0.462.0"      // Icons
  }
}
```

### Build Tools

- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety
- **ESLint**: Code quality

---

## 🔌 Wallet Integration

### Configuration (`Web3Provider.tsx`)

```typescript
// Supported wallets (Coinbase disabled!)
const baseConnectors = [
  new InjectedConnector({
    chains: [sepolia],
    options: {
      name: "MetaMask",
      shimDisconnect: true,
    },
  }),
  // WalletConnect (optional, requires project ID)
  new WalletConnectConnector({
    // ... config
  }),
];
```

### Wallet Selection Modal

**Component**: `src/components/wallet/WalletConnectModal.tsx`

Features:
- Lists available wallets (MetaMask, WalletConnect)
- Shows installation status
- Network validation
- Connection error handling
- Disconnect functionality

**Usage**:
```typescript
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";

const [modalOpen, setModalOpen] = useState(false);

<Button onClick={() => setModalOpen(true)}>
  Connect Wallet
</Button>

<WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
```

### Wallet Status Component

**Component**: `src/components/web3/WalletStatus.tsx`

Smart button that adapts to connection state:

1. **Not Connected**: Shows "Connect Wallet" button
2. **Wrong Network**: Shows "Switch to Sepolia" button
3. **Connected**: Shows address with dropdown menu

```typescript
// States handled automatically
const { address, isConnected } = useAccount();
const { chain } = useNetwork();

if (!isConnected) {
  return <Button>Connect Wallet</Button>;
}

if (chain?.id !== sepolia.id) {
  return <Button variant="destructive">Wrong Network</Button>;
}

// Show connected state with dropdown
```

---

## 🔐 FHE SDK Integration

### Initialization (`FheProvider.tsx`)

**Process**:
1. Load WASM modules (multi-threaded)
2. Initialize SDK with Sepolia config
3. Create FHE instance connected to relayer
4. Expose encryption functions via context

```typescript
// Initialization with optimal thread count
const threadCount = navigator.hardwareConcurrency ?? 4;
await initSDK({ thread: threadCount });

const fheInstance = await createInstance({
  ...SepoliaConfig,
  network: appEnv.rpcUrl,
  relayerUrl: appEnv.relayerUrl,
});
```

### Encrypting Bid Data

```typescript
const { encryptBid } = useFheContext();

// Encrypt bid amount
const payload = await encryptBid({
  value: 1000000000000000000n, // 1 ETH in wei
  account: address,             // User's wallet address
});

// Result
{
  ciphertext: "0x1a2b3c...",  // 256-bit encrypted handle
  inputProof: "0x4d5e6f..."   // Zero-knowledge proof
}
```

### FHE Status Banner

Shows initialization progress at top of page:

```typescript
const FheStatusBanner = () => {
  const { ready, error, relayerUrl } = useFheContext();

  if (error) return <ErrorBanner />;
  if (!ready) return <LoadingBanner />;
  return null; // Hide when ready
};
```

---

## 🧩 Component Structure

### Layout Components

```
src/components/layout/
├── Header.tsx           # Navigation with wallet status
└── Footer.tsx           # (optional)
```

**Header Features**:
- Sticky positioning with glassmorphism
- Responsive mobile menu
- Active route highlighting
- Wallet connection integration

### Wallet Components

```
src/components/wallet/
├── WalletConnectModal.tsx   # Wallet selection modal
└── ...

src/components/web3/
├── WalletStatus.tsx          # Smart connection button
└── ...
```

### Auction Components

```
src/components/auction/
├── BlindBidLotCard.tsx           # Auction lot display
├── BlindBidSubmissionForm.tsx    # Bid submission form
└── ...
```

### UI Components (shadcn/ui)

```
src/components/ui/
├── button.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── alert.tsx
└── ... (40+ components)
```

---

## 👤 User Flow

### Complete Bidding Flow

```mermaid
graph TD
    A[User arrives] --> B{Wallet connected?}
    B -->|No| C[Click "Connect Wallet"]
    C --> D[Select wallet from modal]
    D --> E{Correct network?}
    E -->|No| F[Switch to Sepolia]
    F --> G[Wallet connected ✓]
    E -->|Yes| G
    B -->|Yes| G

    G --> H{FHE SDK ready?}
    H -->|No| I[Wait for initialization]
    I --> H
    H -->|Yes| J[Navigate to /app]

    J --> K[Select auction lot]
    K --> L[Enter bid amount]
    L --> M[Click "Submit Bid"]

    M --> N[Encrypt bid client-side]
    N --> O[Generate ZK proof]
    O --> P[Sign transaction]
    P --> Q[Submit to blockchain]
    Q --> R[Transaction confirmed]
    R --> S[Bid recorded ✓]
```

### Key User Interactions

1. **Wallet Connection**
   - User clicks "Connect Wallet"
   - Modal shows available wallets
   - User selects wallet (MetaMask/WalletConnect)
   - If wrong network → prompt to switch
   - Connection established

2. **FHE Initialization**
   - Automatic on page load
   - Banner shows progress
   - WASM modules loaded
   - SDK ready indicator

3. **Bid Submission**
   - User enters bid amount
   - Click "Submit Bid"
   - Bid encrypted client-side (never plaintext on chain!)
   - Transaction signed in wallet
   - Confirmation toast

---

## 🚀 Deployment

### Environment Variables

Create `.env` file:

```bash
# Smart Contract
VITE_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Network
VITE_APP_RPC_URL=https://sepolia.drpc.org
VITE_APP_RELAYER_URL=https://relayer.testnet.zama.cloud

# Optional
VITE_APP_WALLETCONNECT_ID=your_walletconnect_project_id
```

### Build for Production

```bash
# Install dependencies
npm install

# Build
npm run build

# Preview build
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

**Important Vercel Settings**:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Node Version: 18.x or 20.x

### Custom Vercel Headers

Add `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "SharedArrayBuffer is not defined"

**Cause**: Missing COOP/COEP headers

**Solution**: Check `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
```

#### 2. "FHE instance not ready"

**Cause**: Trying to encrypt before SDK initialization

**Solution**: Wait for `ready` state:

```typescript
const { ready, encryptBid } = useFheContext();

if (!ready) {
  return <div>Loading FHE SDK...</div>;
}

// Now safe to use encryptBid()
```

#### 3. Wallet connection fails

**Causes**:
- MetaMask not installed
- Wrong network
- User rejected connection

**Solutions**:
- Check `connector.ready` before connecting
- Validate `chain?.id === sepolia.id`
- Handle `error` from `useConnect()`

#### 4. "Cannot find module '@zama-fhe/relayer-sdk/bundle'"

**Cause**: Wrong import path

**Solution**: Must use `/bundle` suffix:

```typescript
// ❌ Wrong
import { createInstance } from '@zama-fhe/relayer-sdk';

// ✅ Correct
import { createInstance } from '@zama-fhe/relayer-sdk/bundle';
```

#### 5. Build fails with type errors

**Causes**:
- Outdated `@types/*` packages
- TypeScript version mismatch

**Solutions**:
```bash
# Update types
npm update @types/react @types/react-dom

# Regenerate ABI types
npm run export:abi
```

---

## 📚 Code Examples

### Complete Bid Submission Example

```typescript
import { useState } from "react";
import { useAccount, useContractWrite } from "wagmi";
import { useFheContext } from "@/providers/FheProvider";
import { parseEther } from "viem";
import contractABI from "@/abi/BlindBidAuction.json";

function BidSubmissionForm({ lotId }: { lotId: bigint }) {
  const [bidAmount, setBidAmount] = useState("");
  const { address } = useAccount();
  const { ready, encryptBid, contractAddress } = useFheContext();

  const { write, isLoading } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: "submitBid",
  });

  const handleSubmit = async () => {
    if (!ready || !address) return;

    try {
      // 1. Convert ETH to wei
      const weiAmount = parseEther(bidAmount);

      // 2. Encrypt bid
      const { ciphertext, inputProof } = await encryptBid({
        value: weiAmount,
        account: address,
      });

      // 3. Generate random salt
      const salt = crypto.randomUUID();
      const saltHash = keccak256(toBytes(salt));

      // 4. Submit transaction
      write({
        args: [lotId, ciphertext, inputProof, saltHash],
      });

      // 5. Show success message
      toast.success(`Bid submitted! Save your salt: ${salt}`);
    } catch (error) {
      console.error("Bid submission failed:", error);
      toast.error("Failed to submit bid");
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input
        type="number"
        step="0.01"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder="Bid amount (ETH)"
      />
      <button type="submit" disabled={isLoading || !ready}>
        {isLoading ? "Submitting..." : "Submit Encrypted Bid"}
      </button>
    </form>
  );
}
```

---

## 🎨 Styling Guide

### Tailwind Configuration

- Custom colors: `primary`, `accent`, `luxury`
- Glass morphism: `.glass-card` utility
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`

### Component Styling Patterns

```typescript
// ✅ Good: Responsive with hover states
<Button className="w-full md:w-auto hover:bg-primary/90 transition-colors">
  Connect
</Button>

// ✅ Good: Conditional styling
<div className={`
  px-4 py-2 rounded-lg
  ${isActive ? "bg-primary text-white" : "bg-secondary"}
`}>
  Status
</div>

// ❌ Avoid: Inline styles
<div style={{ backgroundColor: "red" }}>Bad</div>
```

---

## 🔒 Security Best Practices

1. **Never log private keys or encrypted data**
   ```typescript
   // ❌ Bad
   console.log("User bid:", bidAmount);

   // ✅ Good
   console.log("Bid encrypted successfully");
   ```

2. **Validate all user inputs**
   ```typescript
   if (bidAmount <= 0 || bidAmount > MAX_BID) {
     throw new Error("Invalid bid amount");
   }
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     await encryptBid(...);
   } catch (error) {
     // Show user-friendly error
     toast.error("Encryption failed. Please try again.");
     // Log technical details
     console.error("Encryption error:", error);
   }
   ```

4. **Use HTTPS in production**
   - Vercel automatically provides HTTPS
   - Never deploy FHE apps over HTTP

---

## 📞 Support

- **Documentation**: See main README.md
- **FHE Guide**: `docs/FHE_COMPLETE_GUIDE_FULL_CN.md`
- **Smart Contract**: `contracts/BlindBidAuction.sol`
- **Issues**: GitHub Issues

---

**Built with ❤️ using Zama FHE Technology**
