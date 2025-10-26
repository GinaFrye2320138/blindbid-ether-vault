import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import BlindBidLotCard from "@/components/auction/BlindBidLotCard";
import BlindBidSubmissionForm from "@/components/auction/BlindBidSubmissionForm";
import { Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import nftPreview1 from "@/assets/nft-preview-1.jpg";
import nftPreview2 from "@/assets/nft-preview-2.jpg";
import nftPreview3 from "@/assets/nft-preview-3.jpg";

// Mock auction data
const mockAuctions = [
  {
    id: "1",
    title: "Phoenix Rising",
    image: nftPreview1,
    endTime: "2h 34m",
    minBid: "0.5",
    totalBids: 12,
    status: "active" as const,
  },
  {
    id: "2",
    title: "Amber Dimensions",
    image: nftPreview2,
    endTime: "5h 12m",
    minBid: "0.3",
    totalBids: 8,
    status: "active" as const,
  },
  {
    id: "3",
    title: "Golden Gateway",
    image: nftPreview3,
    endTime: "1d 3h",
    minBid: "1.0",
    totalBids: 24,
    status: "active" as const,
  },
];

export default function Auction() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero section */}
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
              <span className="text-sm font-medium">Live Auctions</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-luxury">Exclusive NFT</span>
              <br />
              <span className="text-foreground">Blind Auctions</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Browse rare digital artworks and submit encrypted bids. All bids remain confidential until the reveal phase.
            </p>
          </motion.div>

          {/* Filter bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Showing</span>
              <span className="font-semibold text-foreground">{mockAuctions.length}</span>
              <span className="text-sm">active auctions</span>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main content - Two column layout */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Auction gallery */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-6">
                {mockAuctions.map((auction, index) => (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  >
                    <BlindBidLotCard {...auction} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right column - Bid submission form (sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BlindBidSubmissionForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
