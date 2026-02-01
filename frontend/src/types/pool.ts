export interface Pool {
  address: string;
  token0: string;
  token1: string;
  feeTier: number;
  apy: number;
  tvl: number;
  volume24h: number;
  fee24h: number;
  lastUpdated: string;
}

export interface PoolsResponse {
  pools: Pool[];
  count: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ApyUpdate {
  address: string;
  apy: number;
  previousApy?: number;
  timestamp: string;
  poolAddress?: string; // Backend sends this
}

export type SortField = 'pair' | 'feeTier' | 'apy' | 'tvl' | 'volume24h' | 'fee24h';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// NEW: Pool history types
export interface PoolHistoryDataPoint {
  timestamp: string;
  apy: number;
  tvl: number;
  volume24h: number;
  fee24h: number;
}

export interface PoolHistoryResponse {
  address: string;
  period: string;
  dataPoints: number;
  history: PoolHistoryDataPoint[];
  message?: string;
}