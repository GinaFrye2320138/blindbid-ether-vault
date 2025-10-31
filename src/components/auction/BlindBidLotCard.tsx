import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Lock, ShieldCheck, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BlindBidLotCardProps {
  lotId: bigint;
  title: string;
  curator: string;
  endTime: number;
  totalBids: number;
  status: "active" | "ended" | "upcoming";
  encryptedReserve: `0x${string}`;
  image: string;
  metadataURI: string;
  onClick?: () => void;
  isSelected?: boolean;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

const truncate = (value: string, visible = 6) =>
  value.length <= visible * 2 + 2
    ? value
    : `${value.slice(0, visible + 2)}…${value.slice(-visible)}`;

export default function BlindBidLotCard({
  lotId,
  title,
  curator,
  endTime,
  totalBids,
  status,
  encryptedReserve,
  image,
  metadataURI,
  onClick,
  isSelected = false,
}: BlindBidLotCardProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Fetch NFT metadata
  useEffect(() => {
    if (!metadataURI || metadataURI.length < 10) return;

    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        let url = metadataURI;
        // Convert IPFS URLs to HTTP gateway
        if (url.startsWith('ipfs://')) {
          url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        }
      } catch (error) {
        console.error(`Failed to fetch metadata for lot ${lotId}:`, error);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [metadataURI, lotId]);

  const statusConfig = {
    active: { label: "Live", color: "bg-primary" },
    ended: { label: "Ended", color: "bg-muted" },
    upcoming: { label: "Upcoming", color: "bg-accent" },
  } as const;

  const endDate = new Date(endTime * 1000);
  const endLabel =
    endTime * 1000 > Date.now()
      ? formatDistanceToNow(endDate, { addSuffix: true })
      : "Closed";

  const displayTitle = metadata?.name || title;

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card
        className={`glass-card overflow-hidden group cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:ring-1 hover:ring-primary/50'
        }`}
        onClick={onClick}
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          <div className="absolute top-4 left-4">
            <Badge className={`${statusConfig[status].color} text-background border-0`}>{
              statusConfig[status].label
            }</Badge>
          </div>

          <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass-card flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-5 space-y-4">
          {/* Title Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                #{lotId.toString().padStart(3, '0')}
              </span>
              {metadata?.name && !loadingMetadata && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  NFT
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-1">
              {loadingMetadata ? "Loading..." : displayTitle}
            </h3>
            {metadata?.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Price & Stats Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50">
            {/* Min Price */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Min Price</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-muted-foreground/70" />
                <span className="text-xs font-medium text-muted-foreground">Hidden</span>
              </div>
            </div>

            {/* Current Bids */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Bids</span>
              </div>
              <span className="text-sm font-bold text-primary">{totalBids}</span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{endLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>by</span>
              <span className="font-mono font-medium text-foreground">
                {truncate(curator, 4)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
