// src/providers/yahoo/yahooFinanceProvider.ts
import yahooFinance from 'yahoo-finance2';
import { MarketHistoryPoint } from '../../types/market.types';

// Helper to normalize symbol (e.g. "NSC:INFY" -> "INFY.NS")
function normalizeSymbol(symbol: string): string {
    // If it already contains a dot, assume it's correct (e.g. INFY.NS)
    if (symbol.includes('.')) return symbol;

    // Handle common prefixes if user passes them
    if (symbol.startsWith('NSC:')) {
        return symbol.replace('NSC:', '') + '.NS';
    }
    if (symbol.startsWith('BSE:')) {
        return symbol.replace('BSE:', '') + '.BO';
    }

    // Default to NSE if no suffix/prefix (common for Indian context of this hackathon)
    // But safer to just return as is if we are unsure, or default to .NS?
    // Given the user prompt "NSC:INFY", let's assume they might pass raw "INFY" too.
    // For now, let's default to .NS if it looks like an Indian ticker and has no suffix.
    // But to be safe, let's just return it.
    return symbol;
}

export async function getYahooHistory(
    symbol: string,
    interval: '1d' | '1wk' | '1mo' = '1d',
    range: '1mo' | '3mo' | '6mo' | '1y' | 'ytd' | 'max' = '1mo'
): Promise<MarketHistoryPoint[]> {
    const yahooSymbol = normalizeSymbol(symbol);

    try {
        // yahooFinance.chart is robust for ranges
        const result = await yahooFinance.chart(yahooSymbol, {
            period1: range, // e.g. '1mo'
            interval: interval, // e.g. '1d'
        });

        if (!result || !result.quotes) {
            return [];
        }

        return result.quotes.map((q: any) => ({
            date: q.date.toISOString(),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        }));
    } catch (error) {
        console.error(`Error fetching Yahoo Finance data for ${yahooSymbol}:`, error);
        throw error;
    }
}
