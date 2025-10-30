import { motion } from "framer-motion";
import { Clock, Lock, ShieldCheck } from "lucide-react";
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
}: BlindBidLotCardProps) {
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

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass-card overflow-hidden group">
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

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Lot #{lotId.toString()}</p>
            <h3 className="text-xl font-bold text-foreground group-hover:text-luxury transition-colors">{title}</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Ends</span>
              </div>
              <span className="font-medium text-foreground">{endLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span>Encrypted reserve</span>
              </div>
              <span className="font-mono text-xs text-foreground">{truncate(encryptedReserve)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Sealed bids</span>
              </div>
              <span className="font-semibold text-primary">{totalBids}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground">
            Curated by <span className="font-medium text-foreground">{truncate(curator)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
