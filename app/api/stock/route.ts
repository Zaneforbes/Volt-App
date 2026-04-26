import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "No ticker provided" });
  }

  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const bar = data.results?.[0];

  if (!bar) {
    return NextResponse.json({ error: "No data found" });
  }

  return NextResponse.json({
    ticker: data.ticker,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
    timestamp: bar.t,
  });
}