import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Zap, ExternalLink } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-accent/10" />
      </div>
      
      {/* Animated orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main CTA content */}
          <div className="glass-card rounded-3xl p-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to <span className="text-luxury">Join the Auction</span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Experience the future of NFT auctions with complete privacy and verifiable fairness. Your bids, your secrets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/auctions">
                  <Button 
                    size="lg" 
                    className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg"
                  >
                    Launch Application
                    <Zap className="ml-2 w-5 h-5 group-hover:animate-pulse" />
                  </Button>
                </Link>
                
                <a 
                  href="https://docs.zama.ai/fhevm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-border hover:bg-card px-10 py-6 text-lg group"
                  >
                    Read Documentation
                    <ExternalLink className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </a>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm">
                <div className="flex items-center gap-2 group">
                  <Shield className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span>Fully Encrypted</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Lock className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span>Privacy-First</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 text-center text-sm text-muted-foreground"
          >
            <p>Powered by FHE • Secured by Blockchain • Built for Privacy</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
