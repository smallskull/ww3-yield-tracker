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
}

export interface ApyUpdate {
  address: string;
  apy: number;
  previousApy: number;
  timestamp: string;
}

export type SortField = 'pair' | 'feeTier' | 'apy' | 'tvl' | 'volume24h' | 'fee24h';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
