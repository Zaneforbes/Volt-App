"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Clock3,
  FileText,
  LineChart,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

const watchlist = [
  { ticker: "NVDA", contract: "150C · Jun 19", price: "$12.84", move: "+18.4%", iv: "61.2%", volume: "14.2K", oi: "8.9K" },
  { ticker: "TSLA", contract: "210C · Jul 17", price: "$9.12", move: "+7.9%", iv: "58.4%", volume: "22.4K", oi: "12.1K" },
  { ticker: "PLTR", contract: "38C · May 16", price: "$3.48", move: "-2.1%", iv: "64.9%", volume: "31.6K", oi: "27.8K" },
  { ticker: "MSFT", contract: "445C · Aug 21", price: "$14.31", move: "+5.2%", iv: "34.1%", volume: "8.1K", oi: "5.4K" },
];

const recentJournal = [
  { title: "NVDA breakout retest", contract: "150C · Jun 19", date: "Today · 9:42 AM", note: "Entered on pullback into prior breakout level. IV expanded with underlying reclaiming intraday trend.", tag: "Swing" },
  { title: "TSLA trend continuation", contract: "210C · Jul 17", date: "Yesterday · 2:18 PM", note: "Watched spread tighten and volume accelerate before entry. Took partial into first expansion.", tag: "Momentum" },
  { title: "PLTR failed follow through", contract: "38C · May 16", date: "Apr 17 · 11:05 AM", note: "Underlying lost level and contract repriced quickly on IV fade. Good reminder to size lighter into extension.", tag: "Review" },
];

const chartHeights = [42, 48, 44, 54, 58, 52, 66, 61, 74, 78, 72, 88, 94, 91, 103, 112, 108, 118];

const widthMap: Record<string, string> = {
  "Underlying move": "61%",
  "IV expansion": "29%",
  "Theta decay": "10%",
  "Gamma / delta change": "11%",
  "Spread / liquidity drag": "4%",
  Residual: "12%",
};

function getStatMeta(label: string, value: string) {
  const num = parseFloat(String(value).replace(/[^\d.\-]/g, "")) || 0;
  if (label === "IVR") {
    if (num >= 80) return { badge: "Extreme", tone: "border-yellow-500/30 bg-yellow-500/10" };
    if (num >= 50) return { badge: "Elevated", tone: "border-zinc-700 bg-zinc-900/80" };
    return { badge: "Low", tone: "border-zinc-800 bg-transparent" };
  }
  if (label === "IVP") {
    if (num >= 80) return { badge: "Very rich", tone: "border-yellow-500/30 bg-yellow-500/10" };
    if (num >= 60) return { badge: "Rich", tone: "border-zinc-700 bg-zinc-900/80" };
    return { badge: null, tone: "border-zinc-800 bg-transparent" };
  }
  if (label === "Relative volume") {
    if (num >= 2) return { badge: "Very active", tone: "border-green-500/30 bg-green-500/10" };
    if (num >= 1.5) return { badge: "Active", tone: "border-zinc-700 bg-zinc-900/80" };
    return { badge: null, tone: "border-zinc-800 bg-transparent" };
  }
  if (label === "Day volume") {
    if (num >= 50) return { badge: "Heavy", tone: "border-green-500/30 bg-green-500/10" };
    if (num >= 20) return { badge: "Above avg", tone: "border-zinc-700 bg-zinc-900/80" };
    return { badge: null, tone: "border-zinc-800 bg-transparent" };
  }
  return { badge: null, tone: "border-zinc-800 bg-transparent" };
}

function getEnvironmentSummary(stats: Record<string, string>) {
  const ivr = parseFloat(stats.IVR || "0") || 0;
  const ivp = parseFloat(stats.IVP || "0") || 0;
  const relVol = parseFloat(String(stats["Relative volume"] || "0").replace(/[^\d.\-]/g, "")) || 0;
  const dayVol = parseFloat(String(stats["Day volume"] || "0").replace(/[^\d.\-]/g, "")) || 0;
  const parts: string[] = [];
  if (ivr >= 80 || ivp >= 80) parts.push("High IV environment with rich options pricing.");
  else if (ivr >= 50 || ivp >= 60) parts.push("Moderately elevated implied volatility environment.");
  else parts.push("Calmer implied volatility environment.");
  if (relVol >= 2 || dayVol >= 50) parts.push("Participation is unusually strong and flow looks active.");
  else if (relVol >= 1.5 || dayVol >= 20) parts.push("Participation is above average with decent contract activity.");
  else parts.push("Participation looks fairly normal right now.");
  if (ivr >= 70 && relVol >= 1.5) parts.push("Expect faster repricing, wider swings, and more sensitivity to vol changes.");
  else if (ivr < 40 && relVol < 1.2) parts.push("This setup is more likely to be driven by direction than by vol expansion.");
  else parts.push("Watch both underlying movement and volatility for the next major repricing.");
  return parts.join(" ");
}

function StatRow({ label, value }: { label: string; value: string }) {
  const meta = getStatMeta(label, value);
  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${meta.tone}`}>
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        {meta.badge ? (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-zinc-400">
            {meta.badge}
          </span>
        ) : null}
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function MockDashboard() {
  const selected = watchlist[0];
  const stats = { IVR: "48", IVP: "72", "Relative volume": "1.9x", "Day volume": "18.6K" };
  const environmentSummary = getEnvironmentSummary(stats);
  const statRows: [string, string][] = [
    ["Last", selected.price], ["Implied vol", selected.iv], ["IVR", stats.IVR], ["IVP", stats.IVP],
    ["Relative volume", stats["Relative volume"]], ["Day volume", stats["Day volume"]],
    ["Volume", selected.volume], ["Open interest", selected.oi], ["Spread", "$0.14"], ["Delta", ".42"],
  ];
  const contributionRows: [string, string, string, string][] = [
    ["Underlying move", "+$1.12", "61%", "High"], ["IV expansion", "+$0.54", "29%", "Medium"],
    ["Theta decay", "-$0.18", "10%", "Headwind"], ["Gamma / delta change", "+$0.21", "11%", "Supportive"],
    ["Spread / liquidity drag", "-$0.07", "4%", "Minor"], ["Residual", "+$0.22", "12%", "Noise"],
  ];

  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-zinc-950">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Volt</p>
            <p className="text-xs text-zinc-500">Options tracking platform</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-400 md:flex">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search contracts</span>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-zinc-800 p-4 xl:block">
          <div className="space-y-2">
            {[{ label: "Overview", Icon: LineChart }, { label: "Journal", Icon: BookOpen }, { label: "Alerts", Icon: Bell }, { label: "Research", Icon: Sparkles }].map(({ label, Icon }, i) => (
              <button key={label} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm ${i === 0 ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
                <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span>
                {i === 0 ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Watchlist</p>
            <div className="mt-3 space-y-2">
              {watchlist.slice(0, 3).map((item) => (
                <div key={item.ticker} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{item.ticker}</p>
                    <p className="text-xs text-zinc-500">{item.move}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.contract}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6 p-4 sm:p-5 lg:p-6">
          <div className="grid gap-6 2xl:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Tracked contract</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{selected.ticker} {selected.contract}</h3>
                </div>
                <div className="rounded-2xl bg-white px-4 py-2 text-right text-zinc-950">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Move</p>
                  <p className="text-sm font-semibold">{selected.move}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-200">Contract history</p>
                  <p className="text-xs text-zinc-500">1D · 1W · 1M · 3M · Max</p>
                </div>
                <div className="flex h-64 items-end gap-2 rounded-[1.5rem] bg-zinc-950 p-4">
                  {chartHeights.map((height, i) => (
                    <div key={i} className="flex-1 rounded-t-2xl bg-white/90" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Contract overview</p>
                  <Sparkles className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-4 space-y-3">
                  {statRows.map(([label, value]) => <StatRow key={label} label={label} value={value} />)}
                </div>
                <div className="mt-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">Trade environment</p>
                    <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">Auto summary</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{environmentSummary}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">What moved the contract</p>
                  <p className="mt-1 text-xs text-zinc-500">Modeled contribution breakdown</p>
                </div>
                <LineChart className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Primary driver</p>
                    <p className="mt-2 text-base font-semibold text-white">Underlying move</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Actual move</p>
                    <p className="text-sm font-semibold text-white">+$1.84</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Most of the gain came from directional movement in the underlying, with additional help from IV expansion and a smaller boost from gamma repricing.</p>
              </div>
              <div className="mt-4 space-y-3">
                {contributionRows.map(([label, value, pct, tag]) => (
                  <div key={label} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{label}</p>
                        <p className="mt-1 text-xs text-zinc-500">Estimated contribution</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{value}</p>
                        <p className="mt-1 text-xs text-zinc-500">{pct}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-900">
                        <div className="h-full rounded-full bg-white/90" style={{ width: widthMap[label] || "0%" }} />
                      </div>
                      <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400">{tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Trade journal preview</p>
                  <FileText className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-4 space-y-3">
                  {recentJournal.map((entry) => (
                    <div key={entry.title} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{entry.title}</p>
                            <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">{entry.tag}</span>
                          </div>
                          <p className="mt-2 text-sm text-zinc-500">{entry.contract} · {entry.date}</p>
                        </div>
                        <Star className="h-4 w-4 text-zinc-600" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Replay timeline</p>
                  <Clock3 className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-4 space-y-3">
                  {[["9:35 AM", "Spread narrowed as volume accelerated"], ["10:10 AM", "Underlying reclaimed VWAP"], ["11:24 AM", "IV pushed above session average"], ["1:42 PM", "Contract broke morning high"]].map(([time, text]) => (
                    <div key={time} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{time}</p>
                      <p className="mt-2 text-sm text-zinc-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Market Scanner ────────────────────────────────────────────────────────────

function MarketScanner({ initialTicker }: { initialTicker?: string }) {
  const [ticker, setTicker] = useState(initialTicker || "AAPL");
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [expirationFilter, setExpirationFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getData(overrideTicker?: string) {
    const t = (overrideTicker || ticker).trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError("");
    setData(null);
    setOptions([]);
    try {
      const [stockRes, optionsRes] = await Promise.all([
        fetch(`/api/stock?ticker=${t}`),
        fetch(`/api/options?ticker=${t}`),
      ]);
      const stockJson = await stockRes.json();
      const optionsJson = await optionsRes.json();
      setData(stockJson);
      setOptions(optionsJson.contracts || []);
      if ((optionsJson.contracts || []).length === 0) {
        setError(`No near-the-money contracts found for ${t}. Markets may be closed or this ticker may not have listed options.`);
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialTicker) {
      setTicker(initialTicker);
      getData(initialTicker);
    }
  }, [initialTicker]);

  const spot = data?.close;
  const expirations = Array.from(new Set(options.map((o) => o.expiration))).filter(Boolean) as string[];

  const filteredOptions = options
    .filter((o) => !spot || (o.strike > spot * 0.9 && o.strike < spot * 1.1))
    .filter((o) => typeFilter === "all" || o.type === typeFilter)
    .filter((o) => expirationFilter === "all" || o.expiration === expirationFilter);

  const scoredOptions = filteredOptions.map((o) => {
    const volume = o.volume || 0;
    const oi = o.openInterest || 0;
    const volOiRatio = oi > 0 ? volume / oi : volume > 0 ? volume : 0;
    let signal = "Normal";
    if (volume >= 50 && volOiRatio >= 1) signal = "UNUSUAL";
    else if (volume >= 100 || volOiRatio >= 0.5) signal = "WATCH";
    return { ...o, volOiRatio, signal };
  });

  const sortedOptions = [...scoredOptions].sort((a, b) => {
    const score = (s: string) => s === "UNUSUAL" ? 3 : s === "WATCH" ? 2 : 1;
    return score(b.signal) - score(a.signal) || (b.volume || 0) - (a.volume || 0);
  });

  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Live scanner</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Options activity scanner</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            Pull live options snapshot data, filter near-the-money contracts, and surface unusual volume versus open interest.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && getData()}
            placeholder="Ticker"
            className="h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          />
          <button
            onClick={() => getData()}
            disabled={loading}
            className="h-11 rounded-2xl bg-white px-5 text-sm font-medium text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Get Data"}
          </button>
        </div>
      </div>

      {data && !data.error && (
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {[["Ticker", data.ticker], ["Open", `$${data.open}`], ["High", `$${data.high}`], ["Low", `$${data.low}`], ["Close", `$${data.close}`]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-5 text-sm text-zinc-400">{error}</div>
      )}

      {sortedOptions.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <div className="mb-4 flex gap-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white">
              <option value="all">All</option>
              <option value="call">Calls</option>
              <option value="put">Puts</option>
            </select>
            <select value={expirationFilter} onChange={(e) => setExpirationFilter(e.target.value)} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white">
              <option value="all">All expirations</option>
              {expirations.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-zinc-400">
                {["Signal", "Contract", "Type", "Strike", "Exp", "Volume", "OI", "Vol/OI", "IV", "Delta", "Gamma", "Theta", "Vega"].map((h) => (
                  <th key={h} className="border border-zinc-800 px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOptions.map((o, i) => (
                <tr key={`${o.ticker}-${i}`} className={o.signal === "UNUSUAL" ? "bg-red-500/20" : o.signal === "WATCH" ? "bg-yellow-500/10" : "bg-zinc-950"}>
                  <td className="border border-zinc-800 px-3 py-2 font-semibold text-white">{o.signal}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.ticker}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.type}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">${o.strike}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.expiration}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.volume ?? "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.openInterest ?? "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.volOiRatio ? o.volOiRatio.toFixed(2) : "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.impliedVolatility ? `${(o.impliedVolatility * 100).toFixed(1)}%` : "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.delta?.toFixed?.(2) ?? "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.gamma?.toFixed?.(4) ?? "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.theta?.toFixed?.(2) ?? "-"}</td>
                  <td className="border border-zinc-800 px-3 py-2 text-zinc-300">{o.vega?.toFixed?.(2) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({ title, description, eyebrow }: { title: string; description: string; eyebrow: string }) {
  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
    </div>
  );
}

// ─── Home ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [heroTicker, setHeroTicker] = useState("");
  const [searchedTicker, setSearchedTicker] = useState<string | undefined>(undefined);
  const scannerRef = useRef<HTMLElement>(null);

  function handleHeroSearch() {
    const t = heroTicker.trim().toUpperCase();
    if (!t) return;
    // Reset first so the effect fires even if same ticker is searched again
    setSearchedTicker(undefined);
    setTimeout(() => {
      setSearchedTicker(t);
      setTimeout(() => {
        scannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }, 10);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Volt</p>
              <p className="text-xs text-zinc-500">Options intelligence for traders</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#scanner" className="transition hover:text-white">Scanner</a>
          </nav>
          <button className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:opacity-90">
            Join waitlist
          </button>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400">
                Historical options tracking, IV context, and move attribution
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Know what actually moved your option.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
                Volt brings historical contract pricing, IVR, IVP, relative volume, journal review, and real move decomposition into one minimalist website.
              </p>

              {/* Hero search — scrolls to scanner and auto-fetches data */}
              <div className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={heroTicker}
                  onChange={(e) => setHeroTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}
                  placeholder="Enter a ticker (e.g. NVDA)"
                  className="h-12 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600"
                />
                <button
                  onClick={handleHeroSearch}
                  className="h-12 rounded-2xl bg-white px-6 text-sm font-medium text-zinc-950 transition hover:opacity-90"
                >
                  Search options
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-zinc-500">
                <span className="rounded-full border border-zinc-800 px-3 py-1">Historical contract charts</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1">What moved the contract</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1">IVR / IVP / Relative Volume</span>
              </div>
            </div>

            <div className="relative z-10" id="product">
              <MockDashboard />
            </div>
          </div>
        </section>

        {/* ── Scanner ── */}
        <section ref={scannerRef} className="mx-auto max-w-7xl px-6 py-16 lg:px-8" id="scanner">
          <MarketScanner initialTicker={searchedTicker} />
        </section>

        {/* ── Stats strip ── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[["Focus", "Options only"], ["Positioning", "Website-first product"], ["Edge", "Explains contract repricing"]].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8" id="features">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Features</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">Built for how options traders actually think.</h2>
            <p className="mt-4 text-lg leading-8 text-zinc-400">Everything on the website is centered around understanding the contract itself, not just the underlying ticker.</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <FeatureCard eyebrow="History" title="Historical contract tracking" description="See how a contract moved over time with price history, IV changes, daily volume, relative volume, and open interest in one clean snapshot." />
            <FeatureCard eyebrow="Attribution" title="What moved the contract" description="Break down contract performance into underlying move, IV expansion, theta decay, gamma effects, and residual repricing so you can see what actually drove P&L." />
            <FeatureCard eyebrow="Review" title="Journal and replay" description="Save your thesis, track entries and exits, and review what happened after the trade with timeline context and a cleaner post-trade workflow." />
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-16" id="how-it-works">
          <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 lg:p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">How it works</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">See the contract, the environment, and the reason for the move.</h3>
              <div className="mt-8 space-y-4">
                {[
                  ["1", "Track a contract", "Monitor price, IV, volume, spread, and open interest with a clean historical view."],
                  ["2", "Read the environment", "Use IVR, IVP, relative volume, and day volume to quickly understand whether the setup is calm, elevated, or active."],
                  ["3", "Review the attribution", "Break the move into direction, volatility, decay, and repricing so you can see why the trade actually worked or failed."],
                ].map(([num, title, text]) => (
                  <div key={num} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-zinc-950">{num}</div>
                      <div>
                        <p className="text-base font-semibold text-white">{title}</p>
                        <p className="mt-2 text-sm leading-7 text-zinc-400">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 lg:p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Why it's different</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">Most tools show options data. Volt interprets it.</h3>
              <div className="mt-8 space-y-4">
                {[
                  "Know whether the contract was stock-driven, vol-driven, or theta-dragged.",
                  "Understand whether today's activity is normal or unusual with relative volume and day volume context.",
                  "Review trades later with timeline notes instead of trying to remember what the chart looked like.",
                  "Keep everything in a dark, minimal website that feels fast and premium instead of cluttered.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm leading-7 text-zinc-300">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Early access</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Be first when Volt launches.</h3>
                <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400">Join the waitlist for historical contract tracking, options move attribution, and a cleaner way to review why your trades worked.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[320px] lg:flex-col">
                <input type="email" placeholder="Email address" className="h-12 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600" />
                <button className="h-12 rounded-2xl bg-white px-6 text-sm font-medium text-zinc-950 transition hover:opacity-90">Join waitlist</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-medium text-zinc-300">Volt</p>
            <p className="mt-1">Historical options intelligence for retail traders.</p>
          </div>
          <div className="flex gap-6">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#scanner" className="transition hover:text-white">Scanner</a>
          </div>
        </div>
      </footer>
    </div>
  );
}