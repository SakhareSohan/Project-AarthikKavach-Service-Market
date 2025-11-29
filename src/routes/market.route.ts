// src/routes/market.route.ts
import { Router, Request, Response } from 'express';
import { getFundamentals } from '../services/fundamentals.service';
import { getTechnical } from '../services/technicals.service';
import { getMarketHistory } from '../services/history.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { ALLOWED_TIMEFRAMES, DEFAULT_TIMEFRAME } from '../config/market.config';
import { WATCHLIST_SYMBOLS } from '../config/symbols.config';
import { CombinedMarketSnapshot } from '../types/market.types';

const router = Router();

// GET /market/fundamentals/:symbol
router.get('/fundamentals/:symbol', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol;
        const data = await getFundamentals(symbol);
        if (!data) {
            return res.status(404).json({ error: 'No fundamentals available for symbol' });
        }
        return res.json(data);
    } catch (err) {
        console.error('Error in /market/fundamentals', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /market/technical/:symbol
router.get('/technical/:symbol', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol;
        let timeframe = (req.query.timeframe as string) || DEFAULT_TIMEFRAME;
        if (!ALLOWED_TIMEFRAMES.includes(timeframe)) {
            timeframe = DEFAULT_TIMEFRAME;
        }

        const data = await getTechnical(symbol, timeframe);
        if (!data) {
            return res.status(404).json({ error: 'No technicals available for symbol' });
        }
        return res.json(data);
    } catch (err) {
        console.error('Error in /market/technical', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /market/combined/:symbol
router.get('/combined/:symbol', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol;
        let timeframe = (req.query.timeframe as string) || DEFAULT_TIMEFRAME;
        if (!ALLOWED_TIMEFRAMES.includes(timeframe)) {
            timeframe = DEFAULT_TIMEFRAME;
        }

        const [fundamentals, technical] = await Promise.all([
            getFundamentals(symbol),
            getTechnical(symbol, timeframe),
        ]);

        const combined: CombinedMarketSnapshot = {
            symbol: symbol.toUpperCase(),
            fundamentals,
            technical,
        };

        return res.json(combined);
    } catch (err) {
        console.error('Error in /market/combined', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /market/history/:symbol
// Query params: interval (1d, 1wk, 1mo), range (1mo, 3mo, 6mo, 1y, ytd, max)
router.get('/history/:symbol', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol;
        const interval = (req.query.interval as string) || '1d';
        const range = (req.query.range as string) || '1mo';

        const data = await getMarketHistory(symbol, interval, range);
        if (!data) {
            return res.status(404).json({ error: 'No history available for symbol' });
        }
        return res.json(data);
    } catch (err) {
        console.error('Error in /market/history', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /market/analysis/weakest/:userId
// Returns top 5 weakest stocks (by PnL) with their combined market data
router.get('/analysis/weakest/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const limit = 5;

        // 1. Get weakest stocks from DB
        const weakStocks = await PortfolioRepository.getWeakestStocks(userId, limit);

        // 2. Fetch combined market data for each
        const results = await Promise.all(weakStocks.map(async (stock) => {
            const [fundamentals, technical] = await Promise.all([
                getFundamentals(stock.symbol),
                getTechnical(stock.symbol, DEFAULT_TIMEFRAME),
            ]);

            return {
                ...stock,
                marketData: {
                    symbol: stock.symbol,
                    fundamentals,
                    technical
                }
            };
        }));

        return res.json(results);
    } catch (err) {
        console.error('Error in /market/analysis/weakest', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /market/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { symbols, types } = req.body as {
            symbols?: string[];
            types?: Array<'fundamental' | 'technical'>;
        };

        const targetSymbols = (symbols && symbols.length > 0 ? symbols : WATCHLIST_SYMBOLS).map((s) =>
            s.toUpperCase(),
        );
        const targetTypes = types && types.length > 0 ? types : ['fundamental', 'technical'];

        // TODO: trigger background refresh (Alpha Vantage, DB writes, etc.)
        // For hackathon, you can just log:
        console.log('Refresh requested for', { targetSymbols, targetTypes });

        return res.json({
            status: 'refresh_started',
            symbols: targetSymbols,
            types: targetTypes,
        });
    } catch (err) {
        console.error('Error in /market/refresh', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
