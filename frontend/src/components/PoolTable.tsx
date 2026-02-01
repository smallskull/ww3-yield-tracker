import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Layers } from 'lucide-react';
import { Pool, SortConfig, SortField } from '@/types/pool';
import { AnimatedNumber } from './AnimatedNumber';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface PoolTableProps {
  pools: Pool[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  updatedAddresses: Set<string>;
  selectedPools: string[];
  onSelectPool: (address: string) => void;
  onRowClick: (pool: Pool) => void; // NEW
}

const columns: { key: SortField; label: string; className?: string }[] = [
  { key: 'pair', label: 'Token Pair', className: 'text-left' },
  { key: 'feeTier', label: 'Fee Tier', className: 'text-center' },
  { key: 'apy', label: 'APY %', className: 'text-right' },
  { key: 'tvl', label: 'TVL', className: 'text-right' },
  { key: 'volume24h', label: '24h Volume', className: 'text-right' },
  { key: 'fee24h', label: '24h Fees', className: 'text-right' },
];

function SortIcon({ field, sortConfig }: { field: SortField; sortConfig: SortConfig }) {
  if (sortConfig.field !== field) {
    return <ArrowUpDown className="w-4 h-4 opacity-40" />;
  }
  return sortConfig.direction === 'desc'
      ? <ArrowDown className="w-4 h-4 text-accent" />
      : <ArrowUp className="w-4 h-4 text-accent" />;
}

function FeeTierBadge({ tier }: { tier: number }) {
  const tierPercent = tier / 10000;
  const colors: Record<number, string> = {
    100: 'bg-cyan/20 text-cyan border-cyan/30',
    500: 'bg-primary/20 text-primary border-primary/30',
    3000: 'bg-secondary/20 text-secondary border-secondary/30',
    10000: 'bg-muted text-muted-foreground border-muted',
  };

  return (
      <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          colors[tier] || colors[3000]
      )}>
      {tierPercent}%
    </span>
  );
}

export function PoolTable({
                            pools,
                            sortConfig,
                            onSort,
                            updatedAddresses,
                            selectedPools,
                            onSelectPool,
                            onRowClick, // NEW
                          }: PoolTableProps) {
  return (
      <div className="glass-card glow-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
            <tr className="border-b border-border/50">
              <th className="px-4 py-4 text-left">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compare
                </span>
              </th>
              {columns.map(({ key, label, className }) => (
                  <th
                      key={key}
                      className={cn(
                          'px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors',
                          className
                      )}
                      onClick={() => onSort(key)}
                  >
                    <div className={cn(
                        'flex items-center gap-1.5',
                        className?.includes('text-right') && 'justify-end',
                        className?.includes('text-center') && 'justify-center'
                    )}>
                      {label}
                      <SortIcon field={key} sortConfig={sortConfig} />
                    </div>
                  </th>
              ))}
            </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
            {pools.map((pool, index) => {
              const isUpdated = updatedAddresses.has(pool.address);
              const isSelected = selectedPools.includes(pool.address);

              return (
                  <motion.tr
                      key={pool.address}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn(
                          'table-row-hover cursor-pointer',
                          isSelected && 'bg-primary/5'
                      )}
                      onClick={() => onRowClick(pool)} // NEW: Click handler
                  >
                    <td
                        className="px-4 py-4"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when checking
                    >
                      <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onSelectPool(pool.address)}
                          disabled={!isSelected && selectedPools.length >= 4}
                          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold ring-2 ring-card">
                            {pool.token0.slice(0, 2)}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-xs font-bold ring-2 ring-card text-accent-foreground">
                            {pool.token1.slice(0, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {pool.token0}/{pool.token1}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <FeeTierBadge tier={pool.feeTier} />
                    </td>
                    <td className={cn(
                        'px-4 py-4 text-right transition-all duration-300 rounded',
                        isUpdated && 'apy-highlight'
                    )}>
                      <div className="flex items-center justify-end gap-1.5">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="font-bold text-lg apy-positive">
                        <AnimatedNumber value={pool.apy} format="percent" />
                      </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Layers className="w-4 h-4 opacity-50" />
                        <AnimatedNumber value={pool.tvl} format="currency" className="font-medium text-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <AnimatedNumber value={pool.volume24h} format="currency" className="font-medium" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <AnimatedNumber value={pool.fee24h} format="currency" className="font-medium text-green-400" />
                    </td>
                  </motion.tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
  );
}