import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Shield } from "lucide-react";

import Header from "@/components/layout/Header";
import BlindBidLotCard from "@/components/auction/BlindBidLotCard";
import BlindBidSubmissionForm from "@/components/auction/BlindBidSubmissionForm";
import { CreateAuctionDialog } from "@/components/auction/CreateAuctionDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

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
        metadataURI: lot.metadataURI,
      })),
    [lots],
  );

  const activeCount = decoratedLots.filter((lot) => lot.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Compact Header */}
      <section className="pt-24 pb-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Title & Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Live Auctions
                </h1>
                <Badge variant="secondary" className="px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" />
                  FHE Encrypted
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{activeCount}</span> Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{lots.length}</span> Total
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <CreateAuctionDialog />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Auction Cards - 2 columns on desktop */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-[420px] rounded-xl bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : decoratedLots.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {decoratedLots.map((lot) => (
                    <BlindBidLotCard
                      key={lot.lotId.toString()}
                      {...lot}
                      onClick={() => setSelectedLotId(lot.lotId.toString())}
                      isSelected={selectedLotId === lot.lotId.toString()}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border p-16 text-center">
                  <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Active Auctions</h3>
                      <p className="text-sm text-muted-foreground">
                        Be the first to create an auction and start accepting encrypted bids.
                      </p>
                    </div>
                    <CreateAuctionDialog />
                  </div>
                </div>
              )}
            </div>

            {/* Bid Submission Form - Sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BlindBidSubmissionForm lots={lots} selectedLotId={selectedLotId} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
