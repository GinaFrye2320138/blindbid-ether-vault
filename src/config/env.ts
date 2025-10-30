import { z } from "zod";

/**
 * Supported environment variable contract to keep runtime configuration safe.
 * Defaults follow the public Sepolia endpoints recommended by Zama.
 */
const envSchema = z.object({
  VITE_APP_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  VITE_APP_RPC_URL: z.string().url().optional(),
  VITE_APP_RELAYER_URL: z.string().url().optional(),
  VITE_APP_WALLETCONNECT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

const FALLBACK_RPC_URL = "https://sepolia.drpc.org";
const FALLBACK_RELAYER_URL = "https://relayer.testnet.zama.cloud";

export const appEnv = {
  contractAddress: parsed.success ? parsed.data.VITE_APP_CONTRACT_ADDRESS ?? null : null,
  rpcUrl: parsed.success && parsed.data.VITE_APP_RPC_URL ? parsed.data.VITE_APP_RPC_URL : FALLBACK_RPC_URL,
  relayerUrl:
    parsed.success && parsed.data.VITE_APP_RELAYER_URL ? parsed.data.VITE_APP_RELAYER_URL : FALLBACK_RELAYER_URL,
  walletConnectProjectId:
    parsed.success && parsed.data.VITE_APP_WALLETCONNECT_ID ? parsed.data.VITE_APP_WALLETCONNECT_ID : "",
};

export type RuntimeEnv = typeof appEnv;
