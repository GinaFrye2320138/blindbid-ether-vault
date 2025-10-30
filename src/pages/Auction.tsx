import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Filter } from "lucide-react";

import Header from "@/components/layout/Header";
import BlindBidLotCard from "@/components/auction/BlindBidLotCard";
import BlindBidSubmissionForm from "@/components/auction/BlindBidSubmissionForm";
import { Button } from "@/components/ui/button";
import nftPreview1 from "@/assets/nft-preview-1.jpg";
import nftPreview2 from "@/assets/nft-preview-2.jpg";
import nftPreview3 from "@/assets/nft-preview-3.jpg";
import { useLots } from "@/hooks/useLots";
import { appEnv } from "@/config/env";

const artworkPool = [nftPreview1, nftPreview2, nftPreview3];

const deriveStatus = (startTime: number, endTime: number, closed: boolean): "active" | "ended" | "upcoming" => {
  const now = Math.floor(Date.now() / 1000);
  if (closed || endTime <= now) return "ended";
  if (startTime > now) return "upcoming";
  return "active";
};

export default function Auction() {
  const { data: lots = [], isLoading } = useLots();

  const decoratedLots = useMemo(
    () =>
      lots.map((lot, index) => ({
        lotId: lot.id,
        title: lot.metadataURI || `Encrypted Lot #${lot.id.toString()}`,
        curator: lot.curator,
        endTime: lot.endTime,
        totalBids: lot.bidCount,
        status: deriveStatus(lot.startTime, lot.endTime, lot.closed),
        encryptedReserve: lot.encryptedReserve,
        image: artworkPool[index % artworkPool.length],
      })),
    [lots],
  );

  const activeCount = decoratedLots.filter((lot) => lot.status === "active").length;

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Encrypted Auctions</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-luxury">Exclusive NFT</span>
              <br />
              <span className="text-foreground">Blind Auctions</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Submit sealed bids that stay private until the curator triggers reveal. Contracts live on Sepolia at
              <span className="font-mono text-sm text-primary block mt-2">{appEnv.contractAddress ?? "configure contract address"}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Showing</span>
              <span className="font-semibold text-foreground">{activeCount}</span>
              <span className="text-sm">active auctions</span>
            </div>

            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Filter className="w-4 h-4" />
              Filter (soon)
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-96 glass-card animate-pulse" />
                  ))}
                </div>
              ) : decoratedLots.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {decoratedLots.map((lot) => (
                    <BlindBidLotCard key={lot.lotId.toString()} {...lot} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center text-muted-foreground">
                  <h3 className="text-xl font-semibold text-foreground mb-2">No lots yet</h3>
                  <p>Curators can create a lot via the Hardhat tasks to populate the marketplace.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BlindBidSubmissionForm lots={lots} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
