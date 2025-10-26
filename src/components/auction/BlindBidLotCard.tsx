import { motion } from "framer-motion";
import { Clock, Lock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BlindBidLotCardProps {
  id: string;
  title: string;
  image: string;
  endTime: string;
  minBid: string;
  totalBids: number;
  status: "active" | "ended" | "upcoming";
}

export default function BlindBidLotCard({
  title,
  image,
  endTime,
  minBid,
  totalBids,
  status,
}: BlindBidLotCardProps) {
  const statusConfig = {
    active: { label: "Live", color: "bg-primary" },
    ended: { label: "Ended", color: "bg-muted" },
    upcoming: { label: "Upcoming", color: "bg-accent" },
  };

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-card overflow-hidden group cursor-pointer">
        {/* NFT Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Status badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`${statusConfig[status].color} text-background border-0`}>
              {statusConfig[status].label}
            </Badge>
          </div>

          {/* Encrypted indicator */}
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass-card flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Card content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-luxury transition-colors">
            {title}
          </h3>

          {/* Stats grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Ends</span>
              </div>
              <span className="font-medium text-foreground">{endTime}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Min Bid</span>
              </div>
              <span className="font-bold text-primary">{minBid} ETH</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Sealed Bids</span>
              </div>
              <span className="font-medium text-foreground">{totalBids}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Auction Progress</span>
              <span>75%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
