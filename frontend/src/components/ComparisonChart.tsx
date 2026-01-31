import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { X } from 'lucide-react';
import { Pool } from '@/types/pool';
import { Button } from '@/components/ui/button';

interface ComparisonChartProps {
  pools: Pool[];
  selectedAddresses: string[];
  onClose: () => void;
}

const COLORS = [
  'hsl(265, 89%, 66%)', // purple
  'hsl(185, 100%, 50%)', // cyan
  'hsl(220, 70%, 50%)', // blue
  'hsl(142, 76%, 50%)', // green
];

interface ChartDataPoint {
  time: string;
  [key: string]: number | string;
}

export function ComparisonChart({ pools, selectedAddresses, onClose }: ComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  const selectedPools = useMemo(() => 
    pools.filter(p => selectedAddresses.includes(p.address)),
    [pools, selectedAddresses]
  );

  // Generate initial historical data and update in real-time
  useEffect(() => {
    // Generate historical data points
    const generateHistoricalData = () => {
      const data: ChartDataPoint[] = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2 * 60 * 1000); // 2 min intervals
        const point: ChartDataPoint = {
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        
        selectedPools.forEach((pool, idx) => {
          const key = `${pool.token0}/${pool.token1}`;
          // Generate realistic APY variation
          const baseApy = pool.apy;
          const variation = (Math.random() - 0.5) * 2;
          point[key] = parseFloat((baseApy + variation * (1 - i / 30)).toFixed(2));
        });
        
        data.push(point);
      }
      
      return data;
    };

    setChartData(generateHistoricalData());

    // Update with new data points
    const interval = setInterval(() => {
      setChartData(prev => {
        const now = new Date();
        const newPoint: ChartDataPoint = {
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        
        selectedPools.forEach(pool => {
          const key = `${pool.token0}/${pool.token1}`;
          newPoint[key] = pool.apy;
        });
        
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedPools]);

  if (selectedPools.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-card glow-border p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold gradient-text">APY Comparison</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing {selectedPools.length} pools over time
          </p>
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
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              tickFormatter={(value) => `${value}%`}
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
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: 'hsl(210, 40%, 98%)' }}>{value}</span>}
            />
            {selectedPools.map((pool, index) => (
              <Line
                key={pool.address}
                type="monotone"
                dataKey={`${pool.token0}/${pool.token1}`}
                stroke={COLORS[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4">
        {selectedPools.map((pool, index) => (
          <div
            key={pool.address}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{ backgroundColor: `${COLORS[index]}20`, borderColor: COLORS[index] }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="font-medium">{pool.token0}/{pool.token1}</span>
            <span className="text-muted-foreground">({pool.apy.toFixed(2)}%)</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
