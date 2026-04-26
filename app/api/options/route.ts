import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase() || "AAPL";

  // Fetch up to 250 contracts with greeks enabled
  const url = `https://api.polygon.io/v3/snapshot/options/${ticker}?limit=250&contract_type=call&contract_type=put&apiKey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      // Try without filters as fallback
      const fallbackUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}?limit=250&apiKey=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();

      const contracts = (fallbackData.results || []).map((c: any) => ({
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

      return NextResponse.json({ contracts });
    }

    const contracts = data.results.map((c: any) => ({
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

    return NextResponse.json({ contracts });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch options data", contracts: [] });
  }
}