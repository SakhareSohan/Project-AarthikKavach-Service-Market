// src/repositories/technicals.repository.ts
import pool from '../config/database.config';
import { TechnicalSnapshot } from '../types/market.types';

export class TechnicalsRepository {
    static async getLatest(symbol: string, timeframe: string): Promise<TechnicalSnapshot | null> {
        const query = `
      SELECT * FROM technicals_cache
      WHERE symbol = $1 AND timeframe = $2
      ORDER BY as_of DESC
      LIMIT 1;
    `;
        const { rows } = await pool.query(query, [symbol, timeframe]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            symbol: row.symbol,
            timeframe: row.timeframe,
            asOf: row.as_of.toISOString(),
            source: row.source || 'db', // Schema doesn't have source column in technicals_cache? Wait, let me check schema.
            // Schema provided: technicals_cache DOES NOT have 'source' column in the CREATE TABLE block provided by user!
            // "CREATE TABLE IF NOT EXISTS technicals_cache ( ... symbol, timeframe, as_of ... )"
            // But the type definition has 'source'. I will default to 'db' or 'static' if missing.

            price: {
                lastClose: row.last_close ? parseFloat(row.last_close) : null,
                changePct1D: row.change_pct_1d ? parseFloat(row.change_pct_1d) : null,
                high52W: row.high_52w ? parseFloat(row.high_52w) : null,
                low52W: row.low_52w ? parseFloat(row.low_52w) : null,
            },
            trend: {
                sma20: row.sma_20 ? parseFloat(row.sma_20) : null,
                sma50: row.sma_50 ? parseFloat(row.sma_50) : null,
                sma200: row.sma_200 ? parseFloat(row.sma_200) : null,
            },
            momentum: {
                rsi14: row.rsi_14 ? parseFloat(row.rsi_14) : null,
            },
            volatility: {
                beta: row.beta ? parseFloat(row.beta) : null,
            },
            patternSignals: row.pattern_signals || [],
        };
    }

    static async upsert(data: TechnicalSnapshot): Promise<void> {
        // Note: Schema provided by user for technicals_cache:
        // symbol, timeframe, as_of, last_close, change_pct_1d, high_52w, low_52w, sma_20, sma_50, sma_200, rsi_14, macd_value, macd_signal, macd_hist, atr_14, beta, pattern_signals, raw_payload
        // It MISSES 'source'. I will ignore 'source' for DB write.

        const query = `
      INSERT INTO technicals_cache (
        symbol, timeframe, as_of,
        last_close, change_pct_1d, high_52w, low_52w,
        sma_20, sma_50, sma_200,
        rsi_14, beta, pattern_signals, raw_payload
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14
      )
      ON CONFLICT (id) DO NOTHING;
    `;

        await pool.query(query, [
            data.symbol,
            data.timeframe,
            data.asOf,
            data.price.lastClose,
            data.price.changePct1D,
            data.price.high52W,
            data.price.low52W,
            data.trend.sma20,
            data.trend.sma50,
            data.trend.sma200,
            data.momentum.rsi14,
            data.volatility.beta,
            data.patternSignals,
            JSON.stringify(data)
        ]);
    }
}
