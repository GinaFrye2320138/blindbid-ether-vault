import { useState } from "react";
import { useConnect, useAccount, useDisconnect, useNetwork, useSwitchNetwork } from "wagmi";
import { Wallet, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sepolia } from "wagmi/chains";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WalletConnectModal Component
 *
 * Professional wallet connection modal with:
 * - Multiple wallet options (MetaMask, WalletConnect)
 * - Network validation (Sepolia-only)
 * - Connection status indication
 * - Responsive design
 * - Error handling
 *
 * Features:
 * - Automatic network switching to Sepolia
 * - Coinbase Wallet disabled per FHE guidelines
 * - Clear visual feedback during connection
 * - Disconnect functionality
 */
export const WalletConnectModal = ({ open, onOpenChange }: WalletConnectModalProps) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { connect, connectors, isLoading, pendingConnector, error } = useConnect({
    onSuccess: () => {
      // Auto-close modal on successful connection
      setTimeout(() => onOpenChange(false), 500);
    },
  });

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check if current network is Sepolia
  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

  /**
   * Handle wallet connection
   * Clears previous errors and initiates connection with selected wallet
   */
  const handleConnect = (connector: typeof connectors[0]) => {
    setConnectionError(null);
    connect({ connector });
  };

  /**
   * Handle network switch to Sepolia
   */
  const handleSwitchNetwork = () => {
    if (switchNetwork) {
      switchNetwork(sepolia.id);
    }
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
  };

  // Filter out Coinbase Wallet connector (disabled per FHE guidelines)
  const availableConnectors = connectors.filter(
    (connector) => !connector.id.toLowerCase().includes("coinbase")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {isConnected ? "Wallet Connected" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? "Manage your wallet connection"
              : "Choose a wallet to connect to BlindBid"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connected State */}
          {isConnected && address && (
            <div className="space-y-4">
              {/* Account Info */}
              <Alert>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <AlertDescription>
                  <div className="font-medium mb-1">Connected Account</div>
                  <div className="font-mono text-xs break-all">{address}</div>
                </AlertDescription>
              </Alert>

              {/* Wrong Network Warning */}
              {isWrongNetwork && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Wrong Network</div>
                    <div className="text-sm mb-3">
                      BlindBid only works on Sepolia testnet. Please switch your network.
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSwitchNetwork}
                      disabled={!switchNetwork}
                    >
                      Switch to Sepolia
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Network Info (when on correct network) */}
              {!isWrongNetwork && chain && (
                <div className="p-3 rounded-lg bg-secondary/50 border">
                  <div className="text-sm text-muted-foreground mb-1">Network</div>
                  <div className="font-medium">{chain.name}</div>
                </div>
              )}

              {/* Disconnect Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDisconnect}
              >
                Disconnect Wallet
              </Button>
            </div>
          )}

          {/* Not Connected State */}
          {!isConnected && (
            <>
              {/* Connection Error */}
              {(error || connectionError) && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {error?.message || connectionError || "Failed to connect wallet"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Wallet Options */}
              <div className="space-y-2">
                {availableConnectors.map((connector) => {
                  const isMetaMask = connector.id === "injected";
                  const isWalletConnect = connector.id === "walletConnect";

                  return (
                    <Button
                      key={connector.id}
                      variant="outline"
                      className="w-full justify-between h-auto py-4"
                      disabled={!connector.ready || isLoading}
                      onClick={() => handleConnect(connector)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Wallet Icon */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-primary" />
                        </div>

                        {/* Wallet Info */}
                        <div className="text-left">
                          <div className="font-medium">
                            {isMetaMask && "MetaMask"}
                            {isWalletConnect && "WalletConnect"}
                            {!isMetaMask && !isWalletConnect && connector.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {!connector.ready && "(Not installed)"}
                            {isLoading && pendingConnector?.id === connector.id && "Connecting..."}
                            {connector.ready && !isLoading && "Available"}
                          </div>
                        </div>
                      </div>

                      {/* Connection Status */}
                      {isLoading && pendingConnector?.id === connector.id && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  <div className="font-medium mb-1">Network Requirement</div>
                  Make sure you're connected to Sepolia testnet. The app will prompt you to
                  switch if needed.
                </AlertDescription>
              </Alert>

              {/* Get Testnet ETH Link */}
              <div className="pt-2 border-t">
                <a
                  href="https://sepoliafaucet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                >
                  Need Sepolia ETH? Get from faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
