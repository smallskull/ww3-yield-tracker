import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pool, PoolsResponse, ApyUpdate, SortConfig, SortField } from '@/types/pool';

const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

export function usePoolData(limit: number = 20) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAddresses, setUpdatedAddresses] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'apy', direction: 'desc' });
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial data with limit parameter
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/pools?limit=${limit}&sort=${sortConfig.field}&order=${sortConfig.direction}`);
        if (!response.ok) throw new Error('Failed to fetch pools');
        const data: PoolsResponse = await response.json();
        setPools(data.pools);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pools');
        console.error('Failed to fetch pools:', err);
        // Fallback to empty array on error
        setPools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [limit, sortConfig.field, sortConfig.direction]);

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
      // Backend sends poolAddress, but we need to handle both formats
      const address = data.poolAddress || data.address;

      setPools(prev => prev.map(pool =>
          pool.address.toLowerCase() === address.toLowerCase()
              ? { ...pool, apy: data.apy, lastUpdated: data.timestamp }
              : pool
      ));

      setUpdatedAddresses(prev => new Set(prev).add(address));

      // Clear highlight after animation
      setTimeout(() => {
        setUpdatedAddresses(prev => {
          const next = new Set(prev);
          next.delete(address);
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

    return () => {
      socket.disconnect();
    };
  }, [pools.length]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // Sorting is now handled by backend, but we keep this for immediate UI feedback
  const sortedPools = [...pools];

  return {
    pools: sortedPools,
    loading,
    error,
    updatedAddresses,
    sortConfig,
    handleSort,
  };
}