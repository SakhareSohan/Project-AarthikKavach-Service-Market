-- 🚀 002_market_data_schema.sql
-- Adds Market Data Caching & Analytics Views
-- Run this AFTER the core schema.

---------------------------------------------------------------------
-- fundamentals_cache: Store company stats (PE, ROE, etc.)
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fundamentals_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  symbol TEXT NOT NULL,               -- Link key to portfolio_positions
  as_of TIMESTAMPTZ NOT NULL,         -- Validity timestamp
  source TEXT NOT NULL,               -- 'static','alpha_vantage','yfinance'

  pe NUMERIC(12,6),
  pb NUMERIC(12,6),
  debt_to_equity NUMERIC(12,6),
  roe NUMERIC(8,4),
  market_cap NUMERIC(24,2),
  revenue_cagr_3y NUMERIC(8,4),
  eps_cagr_3y NUMERIC(8,4),
  dividend_yield NUMERIC(8,4),

  quality_tags TEXT[],                -- e.g. ['largecap','high_growth']

  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index to fetch the latest fundamental data for a symbol fast
CREATE INDEX IF NOT EXISTS idx_fundamentals_symbol_asof
  ON fundamentals_cache (symbol, as_of DESC);


---------------------------------------------------------------------
-- technicals_cache: Store indicators (RSI, MACD, SMA)
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technicals_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1D', -- '1D','1W'
  as_of TIMESTAMPTZ NOT NULL,

  last_close NUMERIC(18,6),
  change_pct_1d NUMERIC(8,4),
  high_52w NUMERIC(18,6),
  low_52w NUMERIC(18,6),

  sma_20 NUMERIC(18,6),
  sma_50 NUMERIC(18,6),
  sma_200 NUMERIC(18,6),

  rsi_14 NUMERIC(8,4),
  macd_value NUMERIC(18,6),
  macd_signal NUMERIC(18,6),
  macd_hist NUMERIC(18,6),

  atr_14 NUMERIC(18,6),
  beta NUMERIC(8,4),

  pattern_signals TEXT[],             -- e.g. ['golden_cross','oversold']

  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technicals_symbol_timeframe
  ON technicals_cache (symbol, timeframe, as_of DESC);


---------------------------------------------------------------------
-- 🔗 THE BINDING VIEW: vw_portfolio_insights
-- This joins User Holdings + Fundamentals + Technicals
-- Returns ONE row per user position with all market data attached.
---------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS vw_portfolio_insights AS
SELECT
  p.user_id,
  p.broker,
  p.symbol,
  p.quantity,
  p.avg_price,
  p.invested_value,
  p.current_value,
  p.pnl,

  -- Fundamental Data (Latest available)
  f.pe,
  f.pb,
  f.roe,
  f.market_cap,
  f.quality_tags,

  -- Technical Data (Latest 1D candle)
  t.last_close as mkt_price,
  t.rsi_14,
  t.sma_200,
  t.beta,
  t.pattern_signals

FROM vw_portfolio_latest p
-- Join latest Fundamentals
LEFT JOIN LATERAL (
  SELECT pe, pb, roe, market_cap, quality_tags
  FROM fundamentals_cache fc
  WHERE fc.symbol = p.symbol
  ORDER BY fc.as_of DESC
  LIMIT 1
) f ON true
-- Join latest Technicals (1D timeframe)
LEFT JOIN LATERAL (
  SELECT last_close, rsi_14, sma_200, beta, pattern_signals
  FROM technicals_cache tc
  WHERE tc.symbol = p.symbol
  AND tc.timeframe = '1D'
  ORDER BY tc.as_of DESC
  LIMIT 1
) t ON true;

-- Index for fast user dashboards
CREATE INDEX IF NOT EXISTS idx_vw_portfolio_insights_user ON vw_portfolio_insights (user_id);

-- Note: Refresh this view when market data updates
-- REFRESH MATERIALIZED VIEW CONCURRENTLY vw_portfolio_insights;