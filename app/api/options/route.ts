import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase() || "AAPL";

  const url = `https://api.polygon.io/v3/snapshot/options/${ticker}?limit=20&apiKey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const contracts = data.results?.map((c: any) => ({
    ticker: c.details?.ticker,
    type: c.details?.contract_type,
    strike: c.details?.strike_price,
    expiration: c.details?.expiration_date,
    bid: c.last_quote?.bid,
    ask: c.last_quote?.ask,
    last: c.last_trade?.price,
    volume: c.day?.volume,
    openInterest: c.open_interest,
    impliedVolatility: c.implied_volatility,
    delta: c.greeks?.delta,
    gamma: c.greeks?.gamma,
    theta: c.greeks?.theta,
    vega: c.greeks?.vega,
  }));

  return NextResponse.json({
    underlying: ticker,
    contracts: contracts || [],
  });
}