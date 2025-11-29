// src/services/technicals.service.ts
import { TechnicalSnapshot } from '../types/market.types';
import { getTechnicalStatic } from '../providers/technicals/staticTechnicalsProvider';
import { DEFAULT_TIMEFRAME } from '../config/market.config';
import { TechnicalsRepository } from '../repositories/technicals.repository';

export async function getTechnical(
    symbol: string,
    timeframe: string = DEFAULT_TIMEFRAME,
): Promise<TechnicalSnapshot | null> {
    const upper = symbol.toUpperCase();

    // 1. Try DB cache
    const fromDb = await TechnicalsRepository.getLatest(upper, timeframe);
    if (fromDb) {
        // Check if stale (older than 1 week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        if (new Date(fromDb.asOf) > oneWeekAgo) {
            return fromDb;
        }
        // If stale, fall through
    }

    // 2. Fallback: static provider
    const fromStatic = await getTechnicalStatic(upper, timeframe);
    if (fromStatic) {
        // Save to DB
        await TechnicalsRepository.upsert(fromStatic);
        return fromStatic;
    }

    return null;
}

