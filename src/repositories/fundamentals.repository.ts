// src/repositories/fundamentals.repository.ts
import pool from '../config/database.config';
import { FundamentalsSnapshot } from '../types/market.types';

export class FundamentalsRepository {
    static async getLatest(symbol: string): Promise<FundamentalsSnapshot | null> {
        const query = `
      SELECT * FROM fundamentals_cache
      WHERE symbol = $1
      ORDER BY as_of DESC
      LIMIT 1;
    `;
        const { rows } = await pool.query(query, [symbol]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            symbol: row.symbol,
            asOf: row.as_of.toISOString(),
            source: row.source,
            pe: row.pe ? parseFloat(row.pe) : null,
            pb: row.pb ? parseFloat(row.pb) : null,
            debtToEquity: row.debt_to_equity ? parseFloat(row.debt_to_equity) : null,
            roe: row.roe ? parseFloat(row.roe) : null,
            marketCap: row.market_cap ? parseFloat(row.market_cap) : null,
            revenueCagr3y: row.revenue_cagr_3y ? parseFloat(row.revenue_cagr_3y) : null,
            epsCagr3y: row.eps_cagr_3y ? parseFloat(row.eps_cagr_3y) : null,
            dividendYield: row.dividend_yield ? parseFloat(row.dividend_yield) : null,
            qualityTags: row.quality_tags || [],
        };
    }

    static async upsert(data: FundamentalsSnapshot): Promise<void> {
        const query = `
      INSERT INTO fundamentals_cache (
        symbol, as_of, source, pe, pb, debt_to_equity, roe, market_cap,
        revenue_cagr_3y, eps_cagr_3y, dividend_yield, quality_tags, raw_payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (id) DO NOTHING; -- Usually we just insert new snapshots, no update on ID
    `;
        // Note: The schema doesn't have a unique constraint on (symbol, as_of) that enforces single row update,
        // but we usually just append new snapshots.

        await pool.query(query, [
            data.symbol,
            data.asOf,
            data.source,
            data.pe,
            data.pb,
            data.debtToEquity,
            data.roe,
            data.marketCap,
            data.revenueCagr3y,
            data.epsCagr3y,
            data.dividendYield,
            data.qualityTags,
            JSON.stringify(data)
        ]);
    }
}
