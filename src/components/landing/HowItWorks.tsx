import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Eye, Lock, Trophy } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Connect Wallet",
    description: "Connect your Web3 wallet using MetaMask, WalletConnect, or Coinbase to access the auction platform.",
    icon: Wallet,
  },
  {
    number: "02",
    title: "Browse Auctions",
    description: "Explore exclusive NFT auctions with detailed artwork previews and encrypted bid activity indicators.",
    icon: Eye,
  },
  {
    number: "03",
    title: "Submit Encrypted Bid",
    description: "Enter your bid amount. Our FHE encryption ensures your bid remains completely confidential on-chain.",
    icon: Lock,
  },
  {
    number: "04",
    title: "Win & Claim",
    description: "When the auction ends, the highest bidder is revealed and can claim their exclusive NFT artwork.",
    icon: Trophy,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-secondary" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-luxury">How It Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to participate in encrypted NFT auctions
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="flex items-start gap-6 mb-12 last:mb-0 group"
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    {/* Connecting line */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-20 left-1/2 w-0.5 h-24 bg-gradient-to-b from-primary to-transparent" />
                    )}
                    
                    {/* Number badge */}
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                      {step.number}
                    </div>
                    
                    {/* Icon badge */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full glass-card flex items-center justify-center bg-card group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-luxury transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <Link to="/app">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg">
              Get Started Now
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
