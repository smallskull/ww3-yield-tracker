import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pool, PoolsResponse, ApyUpdate, SortConfig, SortField } from '@/types/pool';

const API_URL = 'http://localhost:3001/api/pools';
const WS_URL = 'http://localhost:3001';

export function usePoolData() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAddresses, setUpdatedAddresses] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'apy', direction: 'desc' });
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch pools');
        const data: PoolsResponse = await response.json();
        setPools(data.pools);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pools');
        // Use mock data for demo
        setPools([
          {
            address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            token0: 'USDC',
            token1: 'WETH',
            feeTier: 500,
            apy: 12.45,
            tvl: 245678900,
            volume24h: 89234567,
            fee24h: 44617,
            lastUpdated: new Date().toISOString(),
          },
          {
            address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
            token0: 'USDC',
            token1: 'WETH',
            feeTier: 3000,
            apy: 8.92,
            tvl: 156789000,
            volume24h: 45678900,
            fee24h: 137037,
            lastUpdated: new Date().toISOString(),
          },
          {
            address: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
            token0: 'WBTC',
            token1: 'WETH',
            feeTier: 3000,
            apy: 6.78,
            tvl: 98765400,
            volume24h: 34567800,
            fee24h: 103703,
            lastUpdated: new Date().toISOString(),
          },
          {
            address: '0x4585fe77225b41b697c938b018e2ac67ac5a20c0',
            token0: 'WBTC',
            token1: 'USDC',
            feeTier: 500,
            apy: 5.23,
            tvl: 76543200,
            volume24h: 23456700,
            fee24h: 11728,
            lastUpdated: new Date().toISOString(),
          },
          {
            address: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
            token0: 'WETH',
            token1: 'USDT',
            feeTier: 500,
            apy: 15.67,
            tvl: 189234500,
            volume24h: 78901234,
            fee24h: 39451,
            lastUpdated: new Date().toISOString(),
          },
          {
            address: '0x3416cf6c708da44db2624d63ea0aaef7113527c6',
            token0: 'USDC',
            token1: 'USDT',
            feeTier: 100,
            apy: 2.34,
            tvl: 456789000,
            volume24h: 234567800,
            fee24h: 23457,
            lastUpdated: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (pools.length === 0) return;

    const socket = io(`${WS_URL}/yields`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      const addresses = pools.map(p => p.address);
      socket.emit('subscribe', addresses);
    });

    socket.on('apy_update', (data: ApyUpdate) => {
      setPools(prev => prev.map(pool => 
        pool.address === data.address 
          ? { ...pool, apy: data.apy, lastUpdated: data.timestamp }
          : pool
      ));
      
      setUpdatedAddresses(prev => new Set(prev).add(data.address));
      
      // Clear highlight after animation
      setTimeout(() => {
        setUpdatedAddresses(prev => {
          const next = new Set(prev);
          next.delete(data.address);
          return next;
        });
      }, 1500);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      setPools(prev => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const pool = prev[randomIndex];
        const change = (Math.random() - 0.5) * 0.5;
        const newApy = Math.max(0.1, pool.apy + change);
        
        setUpdatedAddresses(s => new Set(s).add(pool.address));
        setTimeout(() => {
          setUpdatedAddresses(s => {
            const next = new Set(s);
            next.delete(pool.address);
            return next;
          });
        }, 1500);
        
        return prev.map((p, i) => 
          i === randomIndex 
            ? { ...p, apy: parseFloat(newApy.toFixed(2)), lastUpdated: new Date().toISOString() }
            : p
        );
      });
    }, 3000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [pools.length]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const sortedPools = [...pools].sort((a, b) => {
    const { field, direction } = sortConfig;
    let comparison = 0;
    
    switch (field) {
      case 'pair':
        comparison = `${a.token0}/${a.token1}`.localeCompare(`${b.token0}/${b.token1}`);
        break;
      case 'feeTier':
        comparison = a.feeTier - b.feeTier;
        break;
      case 'apy':
        comparison = a.apy - b.apy;
        break;
      case 'tvl':
        comparison = a.tvl - b.tvl;
        break;
      case 'volume24h':
        comparison = a.volume24h - b.volume24h;
        break;
      case 'fee24h':
        comparison = a.fee24h - b.fee24h;
        break;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });

  return {
    pools: sortedPools,
    loading,
    error,
    updatedAddresses,
    sortConfig,
    handleSort,
  };
}
