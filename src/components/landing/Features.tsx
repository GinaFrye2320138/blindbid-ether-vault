import { motion } from "framer-motion";
import { Shield, BarChart3, Lock, Clock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "FHE Encryption",
    description: "All bids are encrypted using Fully Homomorphic Encryption before submission, ensuring complete confidentiality.",
    gradient: "from-primary via-primary to-accent",
  },
  {
    icon: BarChart3,
    title: "Transparent Results",
    description: "Verifiable on-chain auction results with cryptographic proofs, guaranteeing fair outcomes.",
    gradient: "from-accent via-primary to-primary",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Bidder identities and amounts remain sealed until the reveal phase, preventing bid sniping.",
    gradient: "from-primary via-accent to-primary",
  },
  {
    icon: Clock,
    title: "Automated Lifecycle",
    description: "Smart contracts handle the entire auction lifecycle from bidding to settlement automatically.",
    gradient: "from-accent via-primary to-accent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary to-background" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-luxury">Key Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the next generation of secure and fair NFT auctions
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="glass-card rounded-2xl p-8 group cursor-default"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-background" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
