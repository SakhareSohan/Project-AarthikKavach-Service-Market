// src/services/history.service.ts
import { getYahooHistory } from '../providers/yahoo/yahooFinanceProvider';
import { MarketHistoryResponse } from '../types/market.types';

export async function getMarketHistory(
    symbol: string,
    interval: string,
    range: string
): Promise<MarketHistoryResponse | null> {
    // Validate interval/range if needed, or let provider handle it
    // Cast to specific types expected by provider
    const validIntervals = ['1d', '1wk', '1mo'];
    const validRanges = ['1mo', '3mo', '6mo', '1y', 'ytd', 'max'];

    const safeInterval = validIntervals.includes(interval) ? (interval as '1d' | '1wk' | '1mo') : '1d';
    const safeRange = validRanges.includes(range) ? (range as '1mo' | '3mo' | '6mo' | '1y' | 'ytd' | 'max') : '1mo';

    try {
        const data = await getYahooHistory(symbol, safeInterval, safeRange);
        return {
            symbol,
            interval: safeInterval,
            range: safeRange,
            data,
        };
    } catch (err) {
        console.error('Service error fetching history:', err);
        return null;
    }
}
