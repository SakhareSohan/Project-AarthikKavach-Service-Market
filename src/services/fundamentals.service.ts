// src/services/fundamentals.service.ts
import { FundamentalsSnapshot } from '../types/market.types';
import { getFundamentalsStatic } from '../providers/fundamentals/staticFundamentalsProvider';
import { FundamentalsRepository } from '../repositories/fundamentals.repository';

export async function getFundamentals(symbol: string): Promise<FundamentalsSnapshot | null> {
    const upper = symbol.toUpperCase();

    // 1. Try DB cache
    const fromDb = await FundamentalsRepository.getLatest(upper);
    if (fromDb) {
        // Check if stale (older than 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (new Date(fromDb.asOf) > threeMonthsAgo) {
            // It's fresh enough
            return fromDb;
        }
        // If stale, fall through to fetch new
    }

    // 2. Fallback: static provider (or external API later)
    const fromStatic = await getFundamentalsStatic(upper);
    if (fromStatic) {
        // Save to DB
        await FundamentalsRepository.upsert(fromStatic);
        return fromStatic;
    }

    return null;
}

