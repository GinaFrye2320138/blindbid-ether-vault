import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ethers } from "ethers";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { type Address } from "viem";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { encryptBid, getFheState, onFheStateChange, type FheInitState } from "@/lib/fhe";
import { appEnv } from "@/config/env";
import BlindBidAuctionABI from "@/abi/BlindBidAuction.json";

interface CreateAuctionFormData {
  metadataURI: string;
  reservePrice: string;
  durationHours: string;
}

export function CreateAuctionDialog() {
  const [open, setOpen] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fheState, setFheState] = useState<FheInitState>(getFheState());

  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Subscribe to FHE state changes
  useEffect(() => {
    const unsubscribe = onFheStateChange(setFheState);
    return unsubscribe;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAuctionFormData>({
    defaultValues: {
      metadataURI: "",
      reservePrice: "0.1",
      durationHours: "24",
    },
  });

  const onSubmit = async (data: CreateAuctionFormData) => {
    console.log("[CreateAuction] Form submitted with data:", data);

    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (fheState.status !== 'ready') {
      toast.error("FHE encryption not ready. Please wait...");
      return;
    }

    if (!walletClient) {
      toast.error("Unable to access wallet");
      return;
    }

    // Check if on correct network
    if (chainId !== sepolia.id) {
      console.log(`[CreateAuction] Current chain: ${chainId}, need Sepolia (${sepolia.id})`);

      try {
        console.log("[CreateAuction] Requesting network switch to Sepolia...");
        const toastId = toast.info("Please approve network switch in your wallet", { duration: Infinity });

        // Use wallet_switchEthereumChain RPC method directly
        if (walletClient?.account) {
          await walletClient.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${sepolia.id.toString(16)}` }], // Convert to hex
          });
          console.log("[CreateAuction] Network switched successfully");
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
        console.error("[CreateAuction] Network switch error:", error);

        // Error code 4902 means the chain hasn't been added to MetaMask yet
        if (error.code === 4902) {
          try {
            console.log("[CreateAuction] Adding Sepolia network to wallet...");
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
            console.log("[CreateAuction] Network added and switched");
            toast.success("Switched to Sepolia network");

            // Wait for wagmi to update chainId
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (addError) {
            console.error("[CreateAuction] Failed to add network:", addError);
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
      }
    } else {
      console.log("[CreateAuction] Already on Sepolia network");
    }

    try {
      setIsSubmitting(true);

      // Parse reserve price to wei
      console.log("[CreateAuction] Parsing reserve price:", data.reservePrice);
      const reservePriceWei = ethers.parseEther(data.reservePrice);
      console.log("[CreateAuction] Reserve price in wei:", reservePriceWei.toString());

      // Encrypt reserve price using FHE
      console.log("[CreateAuction] Starting FHE encryption...");
      toast.info("Encrypting reserve price...");

      const { ciphertext, inputProof } = await encryptBid(
        appEnv.contractAddress as Address,
        address as Address,
        reservePriceWei
      );

      console.log("[CreateAuction] Encryption complete");

      // Calculate timestamps
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 60; // Start in 1 minute
      const durationSeconds = parseInt(data.durationHours) * 60 * 60;
      const endTime = startTime + durationSeconds;

      console.log("Creating auction with:", {
        metadataURI: data.metadataURI,
        startTime,
        endTime,
        reservePrice: data.reservePrice,
      });

      // Submit transaction
      console.log("[CreateAuction] Submitting transaction to contract...");
      toast.info("Submitting transaction...");

      const hash = await walletClient.writeContract({
        address: appEnv.contractAddress as Address,
        abi: BlindBidAuctionABI,
        functionName: "createLot",
        args: [
          data.metadataURI,
          BigInt(startTime),
          BigInt(endTime),
          ciphertext as `0x${string}`,
          inputProof as `0x${string}`,
        ],
      });

      setTxHash(hash);
      console.log("[CreateAuction] Transaction submitted:", hash);

      // Wait for confirmation
      if (publicClient) {
        console.log("[CreateAuction] Waiting for transaction confirmation...");
        toast.info("Waiting for confirmation...");
        await publicClient.waitForTransactionReceipt({ hash });
        console.log("[CreateAuction] Transaction confirmed!");
      }

      setIsSuccess(true);
      toast.success("Auction created successfully!");

    } catch (error) {
      console.error("[CreateAuction] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create auction"
      );
    } finally {
      setIsSubmitting(false);
      console.log("[CreateAuction] Submission complete");
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setTxHash(undefined);
    setIsSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Create Auction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Auction</DialogTitle>
          <DialogDescription>
            Set up a new blind auction with encrypted reserve price. All bids will remain private until reveal.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Auction Created!</h3>
              <p className="text-muted-foreground mb-4">
                Your auction has been successfully created on-chain.
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Etherscan
                </a>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Metadata URI */}
            <div className="space-y-2">
              <Label htmlFor="metadataURI">
                Metadata URI
                <span className="text-xs text-muted-foreground ml-2">(IPFS or HTTP URL)</span>
              </Label>
              <Textarea
                id="metadataURI"
                placeholder="ipfs://QmYourHash/metadata.json"
                {...register("metadataURI", {
                  required: "Metadata URI is required",
                  pattern: {
                    value: /^(ipfs:\/\/|https?:\/\/).+/,
                    message: "Must be a valid IPFS or HTTP(S) URL",
                  },
                })}
                className="min-h-[80px]"
              />
              {errors.metadataURI && (
                <p className="text-sm text-destructive">{errors.metadataURI.message}</p>
              )}
            </div>

            {/* Reserve Price */}
            <div className="space-y-2">
              <Label htmlFor="reservePrice">
                Reserve Price (ETH)
                <span className="text-xs text-muted-foreground ml-2">(encrypted on-chain)</span>
              </Label>
              <Input
                id="reservePrice"
                type="number"
                step="0.001"
                placeholder="0.1"
                {...register("reservePrice", {
                  required: "Reserve price is required",
                  min: { value: 0, message: "Reserve price must be non-negative" },
                  max: { value: 1000, message: "Maximum 1000 ETH" },
                })}
              />
              {errors.reservePrice && (
                <p className="text-sm text-destructive">{errors.reservePrice.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum bid amount (can be 0 for no minimum)
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="durationHours">
                Duration (hours)
              </Label>
              <Input
                id="durationHours"
                type="number"
                step="1"
                placeholder="24"
                {...register("durationHours", {
                  required: "Duration is required",
                  min: { value: 1, message: "Minimum 1 hour" },
                  max: { value: 720, message: "Maximum 720 hours (30 days)" },
                })}
              />
              {errors.durationHours && (
                <p className="text-sm text-destructive">{errors.durationHours.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Auction will start in 1 minute after creation
              </p>
            </div>


            {/* Warning about FHE */}
            {fheState.status === 'initializing' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium">Initializing FHE Encryption</p>
                  <p className="text-xs mt-1 opacity-90">
                    Loading cryptographic modules... This may take a few seconds.
                  </p>
                </div>
              </div>
            )}
            {fheState.status === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600 dark:text-red-400">
                  <p className="font-medium">FHE Encryption Error</p>
                  <p className="text-xs mt-1 opacity-90">
                    {fheState.error || 'Failed to initialize encryption system.'}
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!address || fheState.status !== 'ready' || isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Auction"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
