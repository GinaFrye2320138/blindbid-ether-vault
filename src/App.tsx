/**
 * BlindBid - Main Application Component
 *
 * This is the root component that sets up the entire application with
 * all necessary providers and routing configuration.
 *
 * Provider Hierarchy (order matters!):
 * 1. Web3Provider - Wallet connection (must be first)
 * 2. QueryClientProvider - React Query for data fetching
 * 3. TooltipProvider - UI tooltips
 *
 * Key Features:
 * - Wagmi wallet integration (MetaMask, WalletConnect)
 * - Zama FHE SDK for encrypted bidding (via CDN)
 * - React Router for SPA navigation
 * - Toast notifications and tooltips
 * - FHE initialization status banner
 */

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auction from "./pages/Auction";
import NotFound from "./pages/NotFound";
import { Web3Provider } from "@/providers/Web3Provider";
import { ensureFheInstance, getFheState, onFheStateChange, type FheInitState } from "@/lib/fhe";

/**
 * React Query client configuration
 * Manages server state caching and synchronization
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,              // Retry failed queries once
      refetchOnWindowFocus: false,  // Don't refetch on window focus
      staleTime: 30000,      // Data stays fresh for 30 seconds
    },
  },
});

/**
 * FheStatusBanner Component
 *
 * Displays a status banner at the top of the page during FHE SDK initialization
 * or if there are any initialization errors.
 *
 * States:
 * - Loading: Shows "Initializing FHE SDK..."
 * - Error: Shows error message in red
 * - Ready: Banner hidden
 */
const FheStatusBanner = () => {
  const [fheState, setFheState] = useState<FheInitState>(getFheState());

  useEffect(() => {
    const unsubscribe = onFheStateChange(setFheState);
    return unsubscribe;
  }, []);

  // Show error banner if initialization failed
  if (fheState.status === 'error') {
    return (
      <div className="bg-destructive/10 border-b border-destructive/40 text-destructive px-4 py-2 text-sm text-center">
        <strong>FHE Error:</strong> {fheState.error}
      </div>
    );
  }

  // Show loading banner while SDK is initializing
  if (fheState.status === 'initializing') {
    return (
      <div className="bg-secondary border-b border-border/50 text-muted-foreground px-4 py-2 text-sm text-center">
        <span className="inline-flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Initializing FHE SDK (Zama CDN)...
        </span>
      </div>
    );
  }

  // Hide banner when ready
  return null;
};

/**
 * FheInitializer Component
 *
 * Initializes the FHE SDK when the app starts.
 * This component triggers FHE initialization on mount.
 */
const FheInitializer = () => {
  useEffect(() => {
    // Start FHE initialization when app mounts
    console.log('[App] Triggering FHE initialization...');
    ensureFheInstance().catch((error) => {
      console.error('[App] FHE initialization failed:', error);
    });
  }, []);

  return null;
};

/**
 * AppShell Component
 *
 * Contains the routing configuration and FHE status banner.
 * All routes are rendered inside the provider hierarchy.
 *
 * Routes:
 * - / : Landing page
 * - /app : Auction marketplace
 * - * : 404 Not Found page
 */
const AppShell = () => (
  <BrowserRouter>
    {/* Initialize FHE SDK on app start */}
    <FheInitializer />

    {/* FHE initialization status banner */}
    <FheStatusBanner />

    {/* Application routes */}
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auctions" element={<Auction />} />
      {/* Catch-all route for 404 - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

/**
 * App Component
 *
 * Root application component with complete provider hierarchy.
 *
 * Provider Stack:
 * 1. Web3Provider: Wallet connection and network management
 * 2. QueryClientProvider: Server state management
 * 3. TooltipProvider: UI tooltip functionality
 * 4. Toasters: Toast notification systems
 *
 * FHE SDK is loaded via CDN (see index.html) and initialized on app mount.
 * This ensures proper initialization of window.relayerSDK before use.
 */
const App = () => (
  <Web3Provider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toast notification systems */}
        <Toaster />
        <Sonner />

        {/* Main application shell */}
        <AppShell />
      </TooltipProvider>
    </QueryClientProvider>
  </Web3Provider>
);

export default App;
