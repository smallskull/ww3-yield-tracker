import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Pool } from '@/types/pool';
import { usePoolHistory } from '@/hooks/usePoolHistory';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from './AnimatedNumber';

interface PoolHistoryModalProps {
    pool: Pool | null;
    onClose: () => void;
}

export function PoolHistoryModal({ pool, onClose }: PoolHistoryModalProps) {
    const { history, loading, error } = usePoolHistory(pool?.address || null, 24);

    if (!pool) return null;

    // Transform history data for chart
    const chartData = history.map(point => ({
        time: new Date(point.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        apy: point.apy,
        timestamp: point.timestamp,
    }));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glass-card glow-border w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/50 px-6 py-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold ring-2 ring-card">
                                            {pool.token0.slice(0, 2)}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-sm font-bold ring-2 ring-card">
                                            {pool.token1.slice(0, 2)}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold gradient-text">
                                            {pool.token0}/{pool.token1}
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-mono mt-0.5">
                                            {pool.address.slice(0, 10)}...{pool.address.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Current Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Current APY</p>
                                    <p className="text-lg font-bold text-green-400">
                                        <AnimatedNumber value={pool.apy} format="percent" />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                                <DollarSign className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">TVL</p>
                                    <p className="text-lg font-bold">
                                        <AnimatedNumber value={pool.tvl} format="currency" />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                                <Clock className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="text-xs text-muted-foreground">24h Volume</p>
                                    <p className="text-lg font-bold">
                                        <AnimatedNumber value={pool.volume24h} format="currency" />
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                                <DollarSign className="w-5 h-5 text-cyan" />
                                <div>
                                    <p className="text-xs text-muted-foreground">24h Fees</p>
                                    <p className="text-lg font-bold text-green-400">
                                        <AnimatedNumber value={pool.fee24h} format="currency" />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 gradient-text">
                            APY History (Past 24 Hours)
                        </h3>

                        {loading && (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        )}

                        {error && (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-destructive mb-2">Failed to load history</p>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                            </div>
                        )}

                        {!loading && !error && chartData.length === 0 && (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="text-center">
                                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                    <p className="text-muted-foreground">No historical data available yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Data collection started recently. Check back in a few hours.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!loading && !error && chartData.length > 0 && (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(265, 89%, 66%)" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="hsl(265, 89%, 66%)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 20%)" />
                                        <XAxis
                                            dataKey="time"
                                            stroke="hsl(215, 20%, 65%)"
                                            fontSize={12}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="hsl(215, 20%, 65%)"
                                            fontSize={12}
                                            tickLine={false}
                                            tickFormatter={(value) => `${value.toFixed(2)}%`}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(230, 25%, 12%)',
                                                border: '1px solid hsl(230, 20%, 25%)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                            }}
                                            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                                            formatter={(value: number) => [`${value.toFixed(2)}%`, 'APY']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="apy"
                                            stroke="hsl(265, 89%, 66%)"
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: 'hsl(265, 89%, 66%)' }}
                                            activeDot={{ r: 6, strokeWidth: 2 }}
                                            fillOpacity={1}
                                            fill="url(#apyGradient)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {!loading && !error && chartData.length > 0 && (
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Showing {chartData.length} data points over the last 24 hours
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}