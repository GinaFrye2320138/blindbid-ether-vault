import { ReactNode } from "react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { sepolia } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { appEnv } from "@/config/env";

/**
 * Web3Provider - Wallet connection and network management for BlindBid
 *
 * This provider configures Wagmi for wallet interactions on Sepolia testnet.
 * Key features:
 * - Supports MetaMask and WalletConnect
 * - Coinbase Wallet DISABLED per FHE development guidelines
 * - Auto-reconnect on page load
 * - Sepolia-only network (required for Zama FHE)
 */

/**
 * Supported blockchain networks
 * Only Sepolia testnet is supported as required by Zama fhEVM
 */
const supportedChains = [sepolia];

/**
 * Configure blockchain providers and RPC endpoints
 * Uses custom RPC URL from environment configuration
 */
const { chains, publicClient, webSocketPublicClient } = configureChains(supportedChains, [
  jsonRpcProvider({
    rpc: () => ({ http: appEnv.rpcUrl }),
  }),
]);

/**
 * Wallet connectors configuration
 *
 * Supported wallets:
 * 1. MetaMask (and other injected wallets)
 * 2. WalletConnect (optional, requires project ID)
 *
 * NOT supported:
 * - Coinbase Wallet (disabled to prevent connection issues with FHE SDK)
 */
const baseConnectors = [
  // MetaMask and other browser extension wallets
  new InjectedConnector({
    chains,
    options: {
      name: "MetaMask",
      shimDisconnect: true, // Properly handle disconnect state
    },
  }),
];

// Add WalletConnect if project ID is configured
if (appEnv.walletConnectProjectId) {
  baseConnectors.push(
    new WalletConnectConnector({
      chains,
      options: {
        projectId: appEnv.walletConnectProjectId,
        metadata: {
          name: "BlindBid",
          description: "Confidential first-price NFT auctions powered by Zama FHE",
          url: typeof window !== "undefined" ? window.location.origin : "https://blindbid.app",
          icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.svg` : ""],
        },
        showQrModal: true, // Show QR code for mobile wallet connection
      },
    }),
  );
}

/**
 * Wagmi configuration
 * Manages wallet connection state and blockchain interactions
 */
const wagmiConfig = createConfig({
  autoConnect: true, // Automatically reconnect to last used wallet
  connectors: baseConnectors,
  publicClient,
  webSocketPublicClient,
});

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider Component
 *
 * Wraps the application with Wagmi context to enable:
 * - Wallet connection/disconnection
 * - Account state management
 * - Network switching
 * - Transaction signing
 * - Contract interactions
 *
 * Must be placed above FheProvider in the component tree
 * to ensure wallet is connected before FHE initialization.
 */
export const Web3Provider = ({ children }: Web3ProviderProps) => (
  <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
);
