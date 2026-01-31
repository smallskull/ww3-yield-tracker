import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { Pool } from '@/types/pool';
import { AnimatedNumber } from './AnimatedNumber';

interface DashboardHeaderProps {
  pools: Pool[];
  isConnected: boolean;
}

export function DashboardHeader({ pools, isConnected }: DashboardHeaderProps) {
  const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
  const totalVolume = pools.reduce((sum, p) => sum + p.volume24h, 0);
  const avgAPY = pools.length > 0 
    ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length 
    : 0;
  const totalFees = pools.reduce((sum, p) => sum + p.fee24h, 0);

  const stats = [
    { 
      label: 'Total TVL', 
      value: totalTVL, 
      format: 'currency' as const, 
      icon: DollarSign,
      color: 'text-primary' 
    },
    { 
      label: '24h Volume', 
      value: totalVolume, 
      format: 'currency' as const, 
      icon: Activity,
      color: 'text-cyan' 
    },
    { 
      label: 'Avg APY', 
      value: avgAPY, 
      format: 'percent' as const, 
      icon: TrendingUp,
      color: 'text-green-400' 
    },
    { 
      label: '24h Fees', 
      value: totalFees, 
      format: 'currency' as const, 
      icon: Zap,
      color: 'text-secondary' 
    },
  ];

  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            Uniswap V3 Yields
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time APY tracking for liquidity pools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card glow-border p-4 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              <AnimatedNumber value={stat.value} format={stat.format} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
