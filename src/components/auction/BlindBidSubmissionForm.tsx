import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Lock, Send, Shield, Info, KeyRound } from "lucide-react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, keccak256, toUtf8Bytes } from "ethers";
import { type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import blindBidAbi from "@/abi/BlindBidAuction.json";
import { encryptBid, getFheState, onFheStateChange, type FheInitState } from "@/lib/fhe";
import { appEnv } from "@/config/env";
import type { LotSummary } from "@/hooks/useLots";

interface BlindBidSubmissionFormProps {
  lots: LotSummary[];
  selectedLotId: string | null;
}

interface BidFormValues {
  lotId: string;
  amount: string;
  salt: string;
}

const generateSalt = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `0x${Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
};

export default function BlindBidSubmissionForm({ lots, selectedLotId }: BlindBidSubmissionFormProps) {
  const [fheState, setFheState] = useState<FheInitState>(getFheState());
  const { address, chainId, status } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);

  // Subscribe to FHE state changes
  useEffect(() => {
    const unsubscribe = onFheStateChange(setFheState);
    return unsubscribe;
  }, []);

  const defaultLotId = useMemo(() => (lots.length > 0 ? lots[0].id.toString() : ""), [lots]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BidFormValues>({
    defaultValues: { lotId: defaultLotId, amount: "", salt: generateSalt() },
  });

  useEffect(() => {
    if (defaultLotId) {
      setValue("lotId", defaultLotId);
    }
  }, [defaultLotId, setValue]);

  // Update form when a lot is clicked
  useEffect(() => {
    if (selectedLotId) {
      setValue("lotId", selectedLotId);
    }
  }, [selectedLotId, setValue]);

  const [isEncrypting, setEncrypting] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    if (fheState.status !== 'ready') {
      toast.error("FHE encryption not ready. Please wait...");
      return;
    }

    if (status !== "connected" || !address) {
      toast.error("Connect your wallet before submitting a bid.");
      return;
    }

    if (!values.lotId) {
      toast.error("Select a lot to bid on.");
      return;
    }

    const numericAmount = Number(values.amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a positive bid amount.");
      return;
    }

    // Check if on correct network
    if (chainId !== sepolia.id) {
      console.log(`[BidSubmission] Current chain: ${chainId}, need Sepolia (${sepolia.id})`);

      try {
        console.log("[BidSubmission] Requesting network switch to Sepolia...");
        setSwitching(true);
        const toastId = toast.info("Please approve network switch in your wallet", { duration: Infinity });

        // Use wallet_switchEthereumChain RPC method directly
        if (walletClient?.account) {
          await walletClient.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${sepolia.id.toString(16)}` }], // Convert to hex
          });
          console.log("[BidSubmission] Network switched successfully");
          toast.dismiss(toastId);
          toast.success("Switched to Sepolia network");

          // Wait for wagmi to update chainId
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          toast.dismiss(toastId);
          toast.error("Wallet not properly connected");
          return;
        }
      } catch (error: any) {
        console.error("[BidSubmission] Network switch error:", error);

        // Error code 4902 means the chain hasn't been added to MetaMask yet
        if (error.code === 4902) {
          try {
            console.log("[BidSubmission] Adding Sepolia network to wallet...");
            await walletClient?.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${sepolia.id.toString(16)}`,
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
            console.log("[BidSubmission] Network added and switched");
            toast.success("Switched to Sepolia network");

            // Wait for wagmi to update chainId
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (addError) {
            console.error("[BidSubmission] Failed to add network:", addError);
            toast.error("Failed to add Sepolia network. Please add it manually.");
            return;
          }
        } else if (error.code === 4001) {
          // User rejected the request
          toast.error("Network switch cancelled. Please switch to Sepolia to continue.");
          return;
        } else {
          toast.error(`Failed to switch network: ${error.message || 'Unknown error'}`);
          return;
        }
      } finally {
        setSwitching(false);
      }
    } else {
      console.log("[BidSubmission] Already on Sepolia network");
    }

    if (!walletClient) {
      toast.error("Unable to access the connected wallet.");
      return;
    }

    try {
      setEncrypting(true);
      setSubmitting(true);
      const weiAmount = parseEther(values.amount);
      const encrypted = await encryptBid(
        appEnv.contractAddress as Address,
        address as Address,
        weiAmount
      );
      const salt = values.salt.trim() || generateSalt();
      const saltHash = keccak256(toUtf8Bytes(salt));

      const hash = await walletClient.writeContract({
        address: appEnv.contractAddress as Address,
        abi: blindBidAbi,
        functionName: "submitBid",
        args: [BigInt(values.lotId), encrypted.ciphertext, encrypted.inputProof, saltHash],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Encrypted bid submitted", {
        description: `Store this salt safely: ${salt}`,
      });

      reset({ lotId: values.lotId, amount: "", salt: generateSalt() });
      await queryClient.invalidateQueries({ queryKey: ["blindbid", "lots"] });
    } catch (error) {
      console.error(error);
      toast.error("Bid failed", {
        description:
          error instanceof Error ? error.message : "Transaction reverted or the relayer could not be reached.",
      });
    } finally {
      setEncrypting(false);
      setSubmitting(false);
    }
  });

  const encryptionDisabled = fheState.status !== 'ready' || status !== "connected";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="glass-card p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Lock className="w-6 h-6 text-background" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Submit Encrypted Bid</h3>
            <p className="text-sm text-muted-foreground">Ciphertexts are generated client-side with the Zama relayer.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Fail-closed safeguards</p>
              <p>
                Bids encrypt locally and are allowed on-chain only after proof verification. Keep the generated salt so
                you can later prove ownership of this sealed bid.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lotId">Auction lot</Label>
            <select
              id="lotId"
              className="w-full h-12 bg-background border border-border rounded-lg px-3 text-sm focus:border-primary focus:outline-none"
              disabled={lots.length === 0 || encryptionDisabled}
              {...register("lotId")}
            >
              {lots.length === 0 && <option value="">No lots available</option>}
              {lots.map((lot) => (
                <option key={lot.id.toString()} value={lot.id.toString()}>
                  Lot #{lot.id.toString()} · bids {lot.bidCount}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidAmount">Bid amount (ETH)</Label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                disabled={encryptionDisabled}
                {...register("amount", { required: "Enter a bid amount greater than zero" })}
                className="text-2xl font-bold h-16 pr-20 bg-background/50 border-border focus:border-primary"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">ETH</div>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="salt">Bid salt</Label>
              <button
                type="button"
                className="text-xs text-primary flex items-center gap-1"
                onClick={() => setValue("salt", generateSalt())}
              >
                <KeyRound className="w-3 h-3" /> Generate
              </button>
            </div>
            <Input
              id="salt"
              disabled={encryptionDisabled}
              {...register("salt")}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Salt is hashed on-chain ({""}
              <span className="font-mono">keccak256</span>
              ). Store it privately to prove your commitment later.
            </p>
          </div>

          {(isEncrypting || isSubmitting || switching) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-lg bg-secondary border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">
                    {isEncrypting ? "Encrypting bid…" : isSubmitting ? "Awaiting transaction…" : "Switching network…"}
                  </p>
                  <p className="text-muted-foreground">
                    {isEncrypting
                      ? "Generating ciphertext and zero-knowledge input proof."
                      : isSubmitting
                      ? "Confirm the transaction in your wallet."
                      : "Confirm Sepolia in your wallet to continue."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Private</span>
              </div>
              <p className="text-xs text-muted-foreground">Bid amount hidden from other participants.</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sealed</span>
              </div>
              <p className="text-xs text-muted-foreground">Proof-verified ciphertext stored on-chain.</p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
            disabled={encryptionDisabled || isEncrypting || isSubmitting || switching || lots.length === 0}
          >
            {isEncrypting || isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Processing…
              </>
            ) : (
              <>
                Submit Encrypted Bid
                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            After submission bids cannot be withdrawn. Winning decryptions are initiated by the curator through the
            gateway relayer.
          </p>
        </form>
      </Card>
    </motion.div>
  );
}
