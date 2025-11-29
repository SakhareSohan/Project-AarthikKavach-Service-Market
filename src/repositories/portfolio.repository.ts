// src/repositories/portfolio.repository.ts
import pool from '../config/database.config';

export type WeakStock = {
    symbol: string;
    pnl: number;
    dayChangePct: number;
    currentValue: number;
};

export class PortfolioRepository {
    static async getWeakestStocks(userId: string, limit: number = 5): Promise<WeakStock[]> {
        // Strategy: Find positions with lowest PnL (biggest loss) or lowest day change %?
        // User said: "weak or have huge loss in db".
        // I'll sort by PnL ascending (most negative first).

        // We query vw_portfolio_latest or portfolio_positions
        const query = `
      SELECT symbol, pnl, day_change_pct, current_value
      FROM portfolio_positions
      WHERE user_id = $1
      ORDER BY pnl ASC
      LIMIT $2;
    `;

        const { rows } = await pool.query(query, [userId, limit]);

        return rows.map(row => ({
            symbol: row.symbol,
            pnl: parseFloat(row.pnl),
            dayChangePct: row.day_change_pct ? parseFloat(row.day_change_pct) : 0,
            currentValue: parseFloat(row.current_value)
        }));
    }
}
