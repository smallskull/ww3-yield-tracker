import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, RefreshCw } from 'lucide-react';
import { usePoolData } from '@/hooks/usePoolData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { PoolTable } from '@/components/PoolTable';
import { ComparisonChart } from '@/components/ComparisonChart';
import { PoolHistoryModal } from '@/components/PoolHistoryModal';
import { PoolLimitFilter } from '@/components/PoolLimitFilter';
import { Button } from '@/components/ui/button';
import { Pool } from '@/types/pool';

const Index = () => {
  // State for pool limit
  const [poolLimit, setPoolLimit] = useState(20);

  // Use the limit in the hook
  const { pools, loading, error, updatedAddresses, sortConfig, handleSort } = usePoolData(poolLimit);

  // State for comparison
  const [selectedPools, setSelectedPools] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // State for history modal
  const [selectedPoolForHistory, setSelectedPoolForHistory] = useState<Pool | null>(null);

  const handleSelectPool = useCallback((address: string) => {
    setSelectedPools(prev => {
      if (prev.includes(address)) {
        const next = prev.filter(a => a !== address);
        if (next.length < 2) setShowComparison(false);
        return next;
      }
      if (prev.length >= 4) return prev;
      return [...prev, address];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedPools.length >= 2) {
      setShowComparison(true);
    }
  }, [selectedPools.length]);

  const handleCloseComparison = useCallback(() => {
    setShowComparison(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedPools([]);
    setShowComparison(false);
  }, []);

  // NEW: Handler for row click to open history modal
  const handleRowClick = useCallback((pool: Pool) => {
    setSelectedPoolForHistory(pool);
  }, []);

  // NEW: Handler to close history modal
  const handleCloseHistoryModal = useCallback(() => {
    setSelectedPoolForHistory(null);
  }, []);

  // NEW: Handler for limit change
  const handleLimitChange = useCallback((newLimit: number) => {
    setPoolLimit(newLimit);
    // Clear selections when limit changes to avoid stale references
    setSelectedPools([]);
    setShowComparison(false);
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
          >
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading pool data...</p>
          </motion.div>
        </div>
    );
  }

  return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader pools={pools} isConnected={!error} />

          {/* Controls Row: Limit Filter + Compare Controls */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-6"
          >
            {/* Pool Limit Filter */}
            <PoolLimitFilter value={poolLimit} onChange={handleLimitChange} />

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-border/50" />

            {/* Compare Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                  onClick={handleCompare}
                  disabled={selectedPools.length < 2}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare ({selectedPools.length}/4)
              </Button>
              {selectedPools.length > 0 && (
                  <Button
                      variant="outline"
                      onClick={handleClearSelection}
                      className="border-muted-foreground/30 hover:bg-muted"
                  >
                    Clear Selection
                  </Button>
              )}
            </div>

            {/* Help Text */}
            <span className="text-sm text-muted-foreground ml-auto hidden lg:block">
            Click any row for 24h history • Select 2-4 pools to compare
          </span>
          </motion.div>

          {/* Comparison Chart */}
          <AnimatePresence>
            {showComparison && selectedPools.length >= 2 && (
                <ComparisonChart
                    pools={pools}
                    selectedAddresses={selectedPools}
                    onClose={handleCloseComparison}
                />
            )}
          </AnimatePresence>

          {/* Pool Table */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <PoolTable
                pools={pools}
                sortConfig={sortConfig}
                onSort={handleSort}
                updatedAddresses={updatedAddresses}
                selectedPools={selectedPools}
                onSelectPool={handleSelectPool}
                onRowClick={handleRowClick}
            />
          </motion.div>

          {/* Footer */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-sm text-muted-foreground"
          >
            <p>Data updates in real-time via WebSocket connection</p>
            <p className="mt-1 opacity-75">
              Showing {pools.length} Uniswap V3 pools
            </p>
          </motion.div>
        </div>

        {/* Pool History Modal */}
        <PoolHistoryModal
            pool={selectedPoolForHistory}
            onClose={handleCloseHistoryModal}
        />
      </div>
  );
};

export default Index;