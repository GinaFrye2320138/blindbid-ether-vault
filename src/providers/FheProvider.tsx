import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { bytesToHex } from "viem";
import { appEnv } from "@/config/env";

// Type for FHE instance (will be loaded dynamically)
type FhevmInstance = any;

/**
 * FheProvider - Fully Homomorphic Encryption (FHE) SDK Integration
 *
 * This provider initializes the Zama FHE SDK and provides encryption utilities
 * for creating confidential bids. The FHE system allows users to encrypt their
 * bid amounts client-side, ensuring privacy throughout the auction process.
 *
 * Key features:
 * - WASM-based encryption (runs in browser)
 * - Zero-knowledge proof generation
 * - Client-side key management
 * - Integration with Sepolia testnet
 */

/**
 * Parameters for encrypting a bid
 */
interface EncryptBidParams {
  value: bigint;      // Bid amount in wei (e.g., 1000000000000000000n = 1 ETH)
  account: string;    // User's wallet address (for proof generation)
}

/**
 * Result of bid encryption
 * Contains ciphertext and zero-knowledge proof required by the smart contract
 */
interface EncryptedBidPayload {
  ciphertext: `0x${string}`;   // Encrypted bid amount (256-bit handle)
  inputProof: `0x${string}`;   // Zero-knowledge proof for verification
}

/**
 * FHE Context shape
 * Provides encryption functionality and SDK status to child components
 */
interface FheContextShape {
  ready: boolean;                                                    // SDK initialization status
  error: string | null;                                              // Initialization error if any
  contractAddress: `0x${string}` | null;                            // BlindBid contract address
  relayerUrl: string;                                                // Zama relayer endpoint
  encryptBid: (params: EncryptBidParams) => Promise<EncryptedBidPayload>;  // Encryption function
}

const FheContext = createContext<FheContextShape | undefined>(undefined);

interface FheProviderProps {
  children: ReactNode;
}

/**
 * FheProvider Component
 *
 * Bootstraps the Zama FHE SDK on mount and provides encryption utilities
 * to the entire application through React Context.
 *
 * Initialization process:
 * 1. Load WASM modules (multi-threaded for performance)
 * 2. Initialize SDK with Sepolia configuration
 * 3. Create FHE instance connected to relayer
 * 4. Expose encryption functions to child components
 *
 * Must be placed below Web3Provider in component tree to ensure
 * wallet is connected before FHE operations.
 */
export const FheProvider = ({ children }: FheProviderProps) => {
  // FHE instance state
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize FHE SDK on component mount
   * Runs once and cleans up on unmount
   */
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // Validate contract address configuration
      if (!appEnv.contractAddress) {
        setError("BlindBid contract address is not configured. Please set VITE_APP_CONTRACT_ADDRESS in .env");
        return;
      }

      try {
        console.log("[FHE] Initializing Zama FHE SDK...");

        // Dynamically import the FHE SDK to avoid module loading issues
        // Use /bundle path which includes all dependencies pre-bundled
        const { createInstance, initSDK, SepoliaConfig } = await import(
          "@zama-fhe/relayer-sdk/bundle"
        );

        // Detect optimal thread count for WASM performance
        // Uses hardware concurrency (CPU cores) with fallback to 4
        const threadCount = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4;
        console.log(`[FHE] Using ${threadCount} threads for WASM execution`);

        // Initialize WASM modules
        // This loads the cryptographic libraries needed for FHE operations
        await initSDK({ thread: threadCount });

        console.log("[FHE] WASM modules loaded, creating FHE instance...");

        // Create FHE instance with Sepolia configuration
        const fheInstance = await createInstance({
          ...SepoliaConfig,                // Default Sepolia network config
          network: appEnv.rpcUrl,          // Custom RPC endpoint
          relayerUrl: appEnv.relayerUrl,   // Zama relayer for key management
        });

        console.log("[FHE] FHE instance created successfully");

        // Update state only if component is still mounted
        if (!cancelled) {
          setInstance(fheInstance);
          setReady(true);
        }
      } catch (initialisationError) {
        // Handle initialization errors gracefully
        if (!cancelled) {
          const message =
            initialisationError instanceof Error
              ? `FHE initialization failed: ${initialisationError.message}`
              : "Failed to initialize the FHE client. Please refresh the page.";

          console.error("[FHE]", message, initialisationError);
          setError(message);
        }
      }
    };

    void boot();

    // Cleanup on unmount
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Encrypt a bid amount for submission to the smart contract
   *
   * Process:
   * 1. Create encrypted input for the contract
   * 2. Add bid amount as euint64 type
   * 3. Generate ciphertext and zero-knowledge proof
   * 4. Return both for transaction submission
   *
   * @param value - Bid amount in wei (must fit in uint64)
   * @param account - User's wallet address
   * @returns Encrypted payload ready for contract call
   * @throws Error if SDK not ready or encryption fails
   */
  const encryptBid = useCallback(
    async ({ value, account }: EncryptBidParams): Promise<EncryptedBidPayload> => {
      // Validate FHE instance is ready
      if (!instance) {
        throw new Error("FHE instance not ready. Please wait for initialization to complete.");
      }

      if (!appEnv.contractAddress) {
        throw new Error("BlindBid contract address is not configured.");
      }

      console.log(`[FHE] Encrypting bid: ${value} wei for account ${account}`);

      try {
        // Create encrypted input builder
        // This sets up the encryption context for the specific contract and user
        const encryptedInput = instance.createEncryptedInput(appEnv.contractAddress, account);

        // Add bid amount as 64-bit encrypted unsigned integer
        // The value is encrypted client-side before leaving the browser
        encryptedInput.add64(value);

        // Generate ciphertext and proof
        // The relayer provides public keys for encryption
        const result = await encryptedInput.encrypt();

        // Validate encryption result
        if (!result.handles || result.handles.length === 0) {
          throw new Error("Failed to obtain ciphertext handle from relayer.");
        }

        console.log("[FHE] Bid encrypted successfully");

        // Convert binary handles to hex strings for transaction
        return {
          ciphertext: bytesToHex(result.handles[0]),  // First handle = encrypted bid
          inputProof: bytesToHex(result.inputProof),  // ZK proof for verification
        };
      } catch (encryptError) {
        const message = encryptError instanceof Error ? encryptError.message : "Encryption failed";
        console.error("[FHE] Encryption error:", encryptError);
        throw new Error(`Failed to encrypt bid: ${message}`);
      }
    },
    [instance],
  );

  /**
   * Context value memoization
   * Prevents unnecessary re-renders of consuming components
   */
  const value = useMemo<FheContextShape>(
    () => ({
      ready,
      error,
      contractAddress: appEnv.contractAddress as `0x${string}` | null,
      relayerUrl: appEnv.relayerUrl,
      encryptBid,
    }),
    [ready, error, encryptBid],
  );

  return <FheContext.Provider value={value}>{children}</FheContext.Provider>;
};

/**
 * Custom hook to access FHE context
 *
 * Usage:
 * ```typescript
 * const { ready, encryptBid } = useFheContext();
 *
 * if (ready) {
 *   const payload = await encryptBid({ value: 1000000n, account: "0x..." });
 * }
 * ```
 *
 * @throws Error if used outside FheProvider
 */
export const useFheContext = () => {
  const context = useContext(FheContext);
  if (!context) {
    throw new Error("useFheContext must be used within an FheProvider");
  }
  return context;
};
