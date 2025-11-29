// src/providers/fundamentals/staticFundamentalsProvider.ts
import fundamentalsData from './fundamentals.json';
import { FundamentalsSnapshot } from '../../types/market.types';

type RawFundamentalsJson = {
    [symbol: string]: Omit<FundamentalsSnapshot, 'asOf' | 'source'>;
};

const raw = fundamentalsData as RawFundamentalsJson;

export async function getFundamentalsStatic(symbol: string): Promise<FundamentalsSnapshot | null> {
    const key = symbol.toUpperCase();
    const base = raw[key];
    if (!base) return null;

    return {
        ...base,
        symbol: key,
        asOf: new Date().toISOString(),      // placeholder
        source: 'static_snapshot',
    };
}
