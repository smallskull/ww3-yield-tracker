import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: 'currency' | 'percent' | 'number';
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  format = 'number',
  decimals = 2,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const prevValue = useRef(value);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsIncreasing(value > prevValue.current);
      prevValue.current = value;
    }
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [spring]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        if (val >= 1e9) return `$${(val / 1e9).toFixed(decimals)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(decimals)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(decimals)}K`;
        return `$${val.toFixed(decimals)}`;
      case 'percent':
        return `${val.toFixed(decimals)}%`;
      default:
        return val.toFixed(decimals);
    }
  };

  return (
    <motion.span
      className={`inline-block tabular-nums ${className}`}
      initial={false}
      animate={{
        scale: isIncreasing !== null ? [1, 1.05, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </motion.span>
  );
}
