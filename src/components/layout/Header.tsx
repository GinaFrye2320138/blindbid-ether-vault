import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { WalletStatus } from "@/components/web3/WalletStatus";

/**
 * Header Component
 *
 * Main navigation header with:
 * - Brand logo and name
 * - Navigation links
 * - Wallet connection status
 * - Responsive mobile menu
 * - Sticky positioning with glassmorphism effect
 *
 * Features:
 * - Auto-highlights active route
 * - Mobile-friendly hamburger menu
 * - Wallet integration via WalletStatus component
 */
export default function Header() {
  // Get current route for active link highlighting
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  /**
   * Close mobile menu when navigating
   */
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo and Name */}
          <Link to="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
            {/* Logo with gradient background and hover animation */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl group-hover:scale-110 transition-transform duration-300" />
              <div className="relative w-full h-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-background" />
              </div>
            </div>

            {/* Brand name with gradient text */}
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BlindBid
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <Link
              to="/"
              className={`font-medium transition-colors hover:text-primary ${
                isHome ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              to="/auctions"
              className={`font-medium transition-colors hover:text-primary ${
                !isHome ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Auctions
            </Link>
            <Link
              to="/#features"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Features
            </Link>
            <Link
              to="/#how-it-works"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              How It Works
            </Link>
          </nav>

          {/* Desktop: Wallet */}
          <div className="hidden md:flex items-center gap-3">
            {/* Wallet connection button */}
            <WalletStatus />
          </div>

          {/* Mobile: Menu toggle button */}
          <button
            className="md:hidden p-2 hover:bg-card rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
              {/* Mobile navigation links */}
              <Link
                to="/"
                className={`font-medium transition-colors px-2 py-1 rounded ${
                  isHome
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/auctions"
                className={`font-medium transition-colors px-2 py-1 rounded ${
                  !isHome
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                onClick={closeMobileMenu}
              >
                Auctions
              </Link>
              <Link
                to="/#features"
                className="font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors px-2 py-1 rounded"
                onClick={(e) => {
                  if (isHome) {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }
                  closeMobileMenu();
                }}
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                className="font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors px-2 py-1 rounded"
                onClick={(e) => {
                  if (isHome) {
                    e.preventDefault();
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }
                  closeMobileMenu();
                }}
              >
                How It Works
              </Link>

              {/* Mobile: Wallet */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                <WalletStatus />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
