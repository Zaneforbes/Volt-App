import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key", contracts: [] });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase() || "AAPL";

  const url = `https://api.polygon.io/v3/snapshot/options/${ticker}?limit=250&apiKey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    const contracts = (data.results || []).map((c: any) => ({
      ticker: c.details?.ticker,
      type: c.details?.contract_type,
      strike: c.details?.strike_price,
      expiration: c.details?.expiration_date,
      bid: c.last_quote?.bid,
      ask: c.last_quote?.ask,
      last: c.last_trade?.price,
      volume: c.day?.volume ?? 0,
      openInterest: c.open_interest ?? 0,
      impliedVolatility: c.implied_volatility,
      delta: c.greeks?.delta,
      gamma: c.greeks?.gamma,
      theta: c.greeks?.theta,
      vega: c.greeks?.vega,
    }));

    return NextResponse.json({
      underlying: ticker,
      count: contracts.length,
      contracts,
    });
  } catch {
    return NextResponse.json({
      error: "Failed to fetch options data",
      underlying: ticker,
      contracts: [],
    });
  }
}