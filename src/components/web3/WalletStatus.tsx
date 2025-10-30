import { useState } from "react";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Wallet, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";

/**
 * Helper function to truncate Ethereum addresses
 * Displays first 6 and last 4 characters with ellipsis
 *
 * @param value - Full Ethereum address
 * @returns Truncated address (e.g., "0x1234...5678")
 */
const truncateAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

/**
 * WalletStatus Component
 *
 * Smart wallet connection button that adapts to current state:
 * - Not connected: Shows "Connect Wallet" button
 * - Wrong network: Shows "Switch to Sepolia" button
 * - Connected: Shows address with dropdown menu
 *
 * Features:
 * - Professional modal for wallet selection
 * - Network validation and switching
 * - Account management dropdown
 * - Responsive design
 * - Clear visual feedback
 */
export const WalletStatus = () => {
  // Wagmi hooks for wallet state
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  // Modal visibility state
  const [modalOpen, setModalOpen] = useState(false);

  // Check if connected to wrong network
  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

  /**
   * Handle network switch to Sepolia
   */
  const handleSwitchNetwork = () => {
    if (switchNetwork) {
      switchNetwork(sepolia.id);
    }
  };

  /**
   * Render: Not connected state
   * Shows connect button that opens wallet selection modal
   */
  if (!isConnected || !address) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>

        <WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  /**
   * Render: Wrong network state
   * Shows button to switch to Sepolia testnet
   */
  if (isWrongNetwork) {
    return (
      <>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={handleSwitchNetwork}
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Wrong Network</span>
          <span className="sm:hidden">Network</span>
        </Button>

        <WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  /**
   * Render: Connected state
   * Shows address with dropdown for account management
   */
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {/* Connection indicator */}
            <div className="w-2 h-2 rounded-full bg-green-500" />

            {/* Address display */}
            <span className="font-mono text-xs hidden sm:inline">
              {truncateAddress(address)}
            </span>
            <span className="sm:hidden">
              <Wallet className="w-4 h-4" />
            </span>

            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Account section */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs text-muted-foreground">Connected with</p>
              <p className="font-mono text-xs break-all">{address}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Network section */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Network</span>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium">{chain?.name || "Sepolia"}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem
            onClick={() => setModalOpen(true)}
            className="cursor-pointer"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Manage Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Wallet management modal */}
      <WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
