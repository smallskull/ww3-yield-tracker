import { useState, useEffect } from 'react';
import { PoolHistoryResponse, PoolHistoryDataPoint } from '@/types/pool';

const API_BASE_URL = 'http://localhost:3001/api';

export function usePoolHistory(poolAddress: string | null, hours: number = 24) {
    const [history, setHistory] = useState<PoolHistoryDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!poolAddress) {
            setHistory([]);
            return;
        }

        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/pools/${poolAddress}/history?hours=${hours}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch history: ${response.status}`);
                }

                const data: PoolHistoryResponse = await response.json();
                setHistory(data.history || []);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
                setError(errorMessage);
                console.error('Failed to fetch pool history:', err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [poolAddress, hours]);

    return { history, loading, error };
}