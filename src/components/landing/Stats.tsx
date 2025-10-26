import { motion } from "framer-motion";
import { TrendingUp, Users, Shield, Zap } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "2.5M+",
    label: "Total Volume",
    suffix: "ETH",
  },
  {
    icon: Users,
    value: "12,400+",
    label: "Active Bidders",
    suffix: "",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Privacy Rate",
    suffix: "",
  },
  {
    icon: Zap,
    value: "850+",
    label: "NFTs Sold",
    suffix: "",
  },
];

export default function Stats() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzR6TTAgMnYyaDJWMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center group"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-background" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-background mb-2 group-hover:scale-105 transition-transform">
                  {stat.value}
                </div>
                <div className="text-background/80 font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
