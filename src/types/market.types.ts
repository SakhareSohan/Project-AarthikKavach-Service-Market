// src/types/market.types.ts

export type FundamentalsSnapshot = {
    symbol: string;
    asOf: string;                 // ISO timestamp
    source: 'static_snapshot' | 'alpha_vantage' | 'other';

    pe: number | null;
    pb: number | null;
    debtToEquity: number | null;
    roe: number | null;
    marketCap: number | null;
    revenueCagr3y?: number | null;
    epsCagr3y?: number | null;
    dividendYield?: number | null;
    qualityTags?: string[];
};

export type TechnicalSnapshot = {
    symbol: string;
    timeframe: string;            // '1M','3M','6M','1Y'
    asOf: string;
    source: 'static_snapshot' | 'alpha_vantage' | 'other';

    price: {
        lastClose: number | null;
        changePct1D: number | null;
        high52W: number | null;
        low52W: number | null;
    };

    trend: {
        sma20: number | null;
        sma50: number | null;
        sma200: number | null;
    };

    momentum: {
        rsi14: number | null;
    };

    volatility: {
        beta: number | null;
    };

    patternSignals: string[];
};

export type CombinedMarketSnapshot = {
    symbol: string;
    fundamentals: FundamentalsSnapshot | null;
    technical: TechnicalSnapshot | null;
};

export type MarketHistoryPoint = {
    date: string; // ISO date
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type MarketHistoryResponse = {
    symbol: string;
    interval: string;
    range: string;
    data: MarketHistoryPoint[];
};
