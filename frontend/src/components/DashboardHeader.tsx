import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, DollarSign, Check } from 'lucide-react';
import { Pool } from '@/types/pool';
import { AnimatedNumber } from './AnimatedNumber';
import { useMemo } from 'react';

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

  // Calculate "Last Updated" from most recent pool update
  const lastUpdatedInfo = useMemo(() => {
    if (pools.length === 0) return null;

    // Find the most recent lastUpdated timestamp
    const mostRecent = pools.reduce((latest, pool) => {
      const poolTime = new Date(pool.lastUpdated).getTime();
      return poolTime > latest ? poolTime : latest;
    }, 0);

    if (mostRecent === 0) return null;

    const now = Date.now();
    const diffMs = now - mostRecent;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `Updated ${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `Updated ${diffMinutes}m ago`;
    } else {
      const time = new Date(mostRecent);
      return `Last updated: ${time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}`;
    }
  }, [pools]);

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
            className="mb-6"
        >
          {/* Title Row with Badges */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
                DeFinite
              </h1>

              {/* Protocol and Network Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Uniswap V3 Badge - Purple Glow */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 bg-primary/10 text-primary border-primary/30 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(162,89,255,0.3)]">
                Uniswap V3
              </span>

                {/* Ethereum Mainnet Badge - Cyan Glow */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 bg-cyan/10 text-cyan border-cyan/30 hover:border-cyan/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                Ethereum Mainnet
              </span>

                {/* Live Indicator Badge - Green Glow */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 bg-green-400/10 text-green-400 border-green-400/30">
                <div className={`w-1.5 h-1.5 rounded-full bg-green-400 ${isConnected ? 'animate-pulse' : ''}`} />
                  {isConnected ? 'Live' : 'Connecting...'}
              </span>
              </div>
            </div>

            {/* Last Updated Indicator */}
            {lastUpdatedInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{lastUpdatedInfo}</span>
                </div>
            )}
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground">
            Defining yield opportunities in DeFi
          </p>
        </motion.div>

        {/* Stats Grid */}
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