/**
 * FHE SDK Initialization and Encryption Utilities for BlindBid
 *
 * This module provides FHE (Fully Homomorphic Encryption) functionality for the BlindBid auction platform.
 * Using CDN-loaded UMD build for simplified WASM handling.
 *
 * Key Features:
 * - Lazy initialization of FHE SDK with automatic retry logic
 * - CDN UMD-based loading (loaded via script tag in index.html)
 * - Singleton pattern to prevent multiple initializations
 * - Comprehensive error handling and user-friendly error messages
 * - Type-safe encryption functions for auction bids
 * - Initialization state tracking for UI feedback
 * - Uses hexlify for proper byte-to-hex conversion
 *
 * @see https://docs.zama.ai/fhevm for FHE documentation
 */

import { hexlify } from 'ethers';

// ===========================
// Type Declarations
// ===========================

/**
 * Global window interface for CDN-loaded Zama FHE SDK
 * The SDK is loaded via script tag in index.html
 */
declare global {
  interface Window {
    relayerSDK: {
      initSDK: () => Promise<void>;
      createInstance: (config: SepoliaConfigType) => Promise<FheInstance>;
      SepoliaConfig: SepoliaConfigType;
    };
  }
}

/**
 * Sepolia network configuration type
 */
type SepoliaConfigType = any;

/**
 * FHE Instance type (from SDK)
 * Contains methods for creating encrypted inputs
 */
interface FheInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
}

/**
 * Builder for encrypted inputs
 */
interface EncryptedInputBuilder {
  add64: (value: bigint) => EncryptedInputBuilder;
  encrypt: () => Promise<{
    handles: `0x${string}`[];
    inputProof: `0x${string}`;
  }>;
}

/**
 * Initialization state for UI feedback
 */
export type FheInitState =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready' }
  | { status: 'error'; error: string };

// ===========================
// Module State
// ===========================

let fheInstance: FheInstance | null = null;
let initPromise: Promise<FheInstance> | null = null;
let initState: FheInitState = { status: 'idle' };
let stateChangeListeners: ((state: FheInitState) => void)[] = [];

// ===========================
// Constants
// ===========================

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const INIT_TIMEOUT_MS = 60000; // 60 seconds

// ===========================
// State Management
// ===========================

/**
 * Update initialization state and notify listeners
 */
function setInitState(state: FheInitState) {
  initState = state;
  stateChangeListeners.forEach(listener => listener(state));
}

/**
 * Subscribe to FHE initialization state changes
 * Useful for showing loading spinners in UI
 *
 * @param listener - Callback function to be called on state change
 * @returns Unsubscribe function
 */
export function onFheStateChange(listener: (state: FheInitState) => void): () => void {
  stateChangeListeners.push(listener);
  listener(initState); // Immediately call with current state

  return () => {
    stateChangeListeners = stateChangeListeners.filter(l => l !== listener);
  };
}

/**
 * Get current FHE initialization state
 * @returns Current initialization state
 */
export function getFheState(): FheInitState {
  return initState;
}

// ===========================
// Utility Functions
// ===========================

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a function with timeout
 * @param fn - Async function to run
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects on timeout
 */
async function withTimeout<T>(fn: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  );
  return Promise.race([fn, timeoutPromise]);
}

// ===========================
// Core Initialization
// ===========================

/**
 * Initialize FHE SDK with retry logic
 * Internal function - use ensureFheInstance() instead
 *
 * @param attempt - Current attempt number
 * @returns Promise<FHE Instance>
 * @throws Error if initialization fails after all retries
 */
async function initializeFheWithRetry(attempt: number = 1): Promise<FheInstance> {
  try {
    // Verify CDN script loaded the SDK globally
    if (typeof window === 'undefined' || !window.relayerSDK) {
      throw new Error(
        'FHE SDK not loaded from CDN. Ensure the script tag is present in index.html:\n' +
        '<script src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"></script>'
      );
    }

    console.log(`[FHE] Initialization attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
    const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;

    // Initialize WASM module with timeout
    console.log('[FHE] Initializing WASM runtime...');
    await withTimeout(initSDK(), INIT_TIMEOUT_MS);
    console.log('[FHE] ✓ WASM runtime ready');

    // Create FHE instance with SDK's built-in Sepolia configuration
    console.log('[FHE] Creating FHE instance with SepoliaConfig...');
    const instance = await withTimeout(createInstance(SepoliaConfig), INIT_TIMEOUT_MS);
    console.log('[FHE] ✓ FHE instance ready');

    return instance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[FHE] Initialization attempt ${attempt} failed:`, errorMessage);

    // Retry if we haven't exceeded max attempts
    if (attempt < MAX_RETRY_ATTEMPTS) {
      console.log(`[FHE] Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
      return initializeFheWithRetry(attempt + 1);
    }

    // All retries failed
    throw new Error(
      `Failed to initialize FHE SDK after ${MAX_RETRY_ATTEMPTS} attempts. ${errorMessage}`
    );
  }
}

/**
 * Ensure FHE instance is initialized and ready
 * Uses CDN-loaded UMD build for simplified WASM handling
 *
 * This function:
 * - Returns immediately if already initialized
 * - Waits for ongoing initialization if in progress
 * - Starts new initialization with retry logic if needed
 * - Updates state for UI feedback
 *
 * @returns Promise<FHE Instance> - The initialized FHE instance
 * @throws Error if initialization fails after retries
 *
 * @example
 * ```typescript
 * try {
 *   const fhe = await ensureFheInstance();
 *   const input = fhe.createEncryptedInput(contractAddr, userAddr);
 *   // ... use FHE instance
 * } catch (error) {
 *   console.error('FHE initialization failed:', error);
 *   // Show error to user
 * }
 * ```
 */
export async function ensureFheInstance(): Promise<FheInstance> {
  // Return existing instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Using cached instance');
    return fheInstance;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    console.log('[FHE] Initialization in progress, waiting...');
    return initPromise;
  }

  // Start new initialization
  console.log('[FHE] Starting FHE SDK initialization...');
  setInitState({ status: 'initializing' });

  initPromise = (async () => {
    try {
      const instance = await initializeFheWithRetry(1);
      fheInstance = instance;
      setInitState({ status: 'ready' });
      console.log('[FHE] ✓ FHE SDK fully initialized and ready');
      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('[FHE] ✗ Initialization failed:', errorMessage);

      // Reset promise to allow retry
      initPromise = null;
      setInitState({ status: 'error', error: errorMessage });

      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the current FHE instance without initializing
 * Returns null if not yet initialized
 *
 * @returns FHE Instance or null if not initialized
 */
export function getFheInstance(): FheInstance | null {
  return fheInstance;
}

/**
 * Reset FHE instance (useful for testing or reconnecting)
 * Forces re-initialization on next ensureFheInstance() call
 */
export function resetFheInstance(): void {
  console.log('[FHE] Resetting instance');
  fheInstance = null;
  initPromise = null;
  setInitState({ status: 'idle' });
}

// ===========================
// Encryption Functions
// ===========================

/**
 * Encrypted bid result returned by encryptBid
 */
export interface EncryptedBid {
  ciphertext: `0x${string}`;  // Encrypted bid amount (euint64)
  inputProof: `0x${string}`;  // Zero-knowledge proof for verification
}

/**
 * Encrypt bid amount for BlindBid auction
 *
 * This function creates encrypted inputs using Zama FHE technology:
 * 1. Initializes FHE instance (with retry logic)
 * 2. Creates encrypted input builder for the contract
 * 3. Adds bid amount as euint64 (wei)
 * 4. Generates encrypted handle and zero-knowledge proof
 *
 * The encrypted data remains private until the auction is settled.
 * This ensures fair bidding without front-running.
 *
 * @param contractAddress - BlindBid contract address (must be checksummed)
 * @param userAddress - User wallet address (must be checksummed)
 * @param bidWei - Bid amount in wei (bigint, e.g., parseEther("0.1"))
 *
 * @returns Promise<EncryptedBid> - Encrypted handle and proof for contract submission
 *
 * @throws Error if FHE initialization fails
 * @throws Error if encryption fails
 * @throws Error if bid amount is invalid
 *
 * @example
 * ```typescript
 * import { encryptBid } from './fhe';
 * import { parseEther, getAddress } from 'ethers';
 *
 * const encrypted = await encryptBid(
 *   getAddress(contractAddress),
 *   getAddress(userAddress),
 *   parseEther("0.5") // 0.5 ETH bid
 * );
 *
 * // Submit to contract
 * await contract.placeBid(
 *   lotId,
 *   encrypted.ciphertext,
 *   encrypted.inputProof
 * );
 * ```
 */
export async function encryptBid(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  bidWei: bigint
): Promise<EncryptedBid> {
  // Validate inputs
  if (bidWei <= 0n) {
    throw new Error('Bid amount must be positive');
  }

  console.log('[FHE] Encrypting bid:', {
    contractAddress,
    userAddress,
    bidWei: bidWei.toString(),
  });

  try {
    // Ensure FHE instance is initialized
    const instance = await ensureFheInstance();

    // Create encrypted input builder
    const input = instance.createEncryptedInput(contractAddress, userAddress);

    // Add bid amount as euint64
    input.add64(bidWei);

    // Encrypt and generate zero-knowledge proof
    console.log('[FHE] Generating encrypted handle and ZK proof...');
    const { handles, inputProof } = await input.encrypt();

    // Use hexlify to convert byte arrays to hex strings
    const ciphertext = hexlify(handles[0]) as `0x${string}`;
    const proof = hexlify(inputProof) as `0x${string}`;

    console.log('[FHE] ✓ Encryption successful', {
      ciphertextLength: ciphertext.length,
      proofLength: proof.length,
    });

    return {
      ciphertext,
      inputProof: proof,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
    console.error('[FHE] ✗ Encryption failed:', errorMessage);
    throw new Error(`Failed to encrypt bid: ${errorMessage}`);
  }
}
