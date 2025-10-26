import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Send, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function BlindBidSubmissionForm() {
  const [bidAmount, setBidAmount] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    setIsEncrypting(true);

    // Simulate FHE encryption process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsEncrypting(false);
    toast.success("Bid encrypted and submitted successfully!", {
      description: "Your bid remains confidential until the reveal phase.",
    });
    
    setBidAmount("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Lock className="w-6 h-6 text-background" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Submit Encrypted Bid</h3>
            <p className="text-sm text-muted-foreground">Your bid will be encrypted with FHE</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Fully Homomorphic Encryption</p>
              <p>Your bid amount is encrypted before submission and remains confidential until the auction reveal phase.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitBid} className="space-y-6">
          {/* Bid amount input */}
          <div className="space-y-2">
            <Label htmlFor="bidAmount" className="text-sm font-medium text-foreground">
              Bid Amount (ETH)
            </Label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="text-2xl font-bold h-16 pr-20 bg-background/50 border-border focus:border-primary"
                disabled={isEncrypting}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                ETH
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Minimum bid: 0.1 ETH</p>
          </div>

          {/* Encryption status */}
          {isEncrypting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-lg bg-secondary border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Encrypting your bid...</p>
                  <p className="text-muted-foreground">Generating FHE ciphertext and proof bundle</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Private</span>
              </div>
              <p className="text-xs text-muted-foreground">Bid amount hidden</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sealed</span>
              </div>
              <p className="text-xs text-muted-foreground">On-chain encrypted</p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
            disabled={isEncrypting}
          >
            {isEncrypting ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Encrypting Bid...
              </>
            ) : (
              <>
                Submit Encrypted Bid
                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree that your bid is final and cannot be withdrawn
          </p>
        </form>
      </Card>
    </motion.div>
  );
}
