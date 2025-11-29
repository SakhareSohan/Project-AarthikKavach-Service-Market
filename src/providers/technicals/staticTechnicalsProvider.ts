// src/providers/technicals/staticTechnicalsProvider.ts
import technicalsData from './technicals.json';
import { TechnicalSnapshot } from '../../types/market.types';
import { DEFAULT_TIMEFRAME } from '../../config/market.config';

type RawTechnicalsJson = {
    [symbol: string]: {
        [timeframe: string]: Omit<TechnicalSnapshot, 'asOf' | 'source'>;
    };
};

const raw = technicalsData as RawTechnicalsJson;

export async function getTechnicalStatic(
    symbol: string,
    timeframe: string = DEFAULT_TIMEFRAME,
): Promise<TechnicalSnapshot | null> {
    const key = symbol.toUpperCase();
    const tf = timeframe || DEFAULT_TIMEFRAME;

    const tfMap = raw[key];
    if (!tfMap) return null;

    const base = tfMap[tf];
    if (!base) return null;

    return {
        ...base,
        symbol: key,
        timeframe: tf,
        asOf: new Date().toISOString(),
        source: 'static_snapshot',
    };
}
