"use client";

import { useState } from "react";

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [expirationFilter, setExpirationFilter] = useState("all");

  async function getData() {
    const stockRes = await fetch(`/api/stock?ticker=${ticker}`);
    const stockJson = await stockRes.json();
    setData(stockJson);

    const optionsRes = await fetch(`/api/options?ticker=${ticker}`);
    const optionsJson = await optionsRes.json();
    setOptions(optionsJson.contracts || []);
  }

  const spot = data?.close;

  const expirations = Array.from(
    new Set(options.map((option) => option.expiration))
  ).filter(Boolean);

  const filteredOptions = options
    .filter((option) => {
      if (!spot) return true;
      return option.strike > spot * 0.9 && option.strike < spot * 1.1;
    })
    .filter((option) => {
      if (typeFilter === "all") return true;
      return option.type === typeFilter;
    })
    .filter((option) => {
      if (expirationFilter === "all") return true;
      return option.expiration === expirationFilter;
    });

  const scoredOptions = filteredOptions.map((option) => {
    const volume = option.volume || 0;
    const openInterest = option.openInterest || 0;

    const volumeOiRatio =
      openInterest > 0 ? volume / openInterest : volume > 0 ? volume : 0;

    let signal = "Normal";

    if (volume >= 50 && volumeOiRatio >= 1) {
      signal = "UNUSUAL";
    } else if (volume >= 100 || volumeOiRatio >= 0.5) {
      signal = "WATCH";
    }

    return {
      ...option,
      volumeOiRatio,
      signal,
    };
  });

  const sortedOptions = [...scoredOptions].sort((a, b) => {
    const signalScore = (signal: string) => {
      if (signal === "UNUSUAL") return 3;
      if (signal === "WATCH") return 2;
      return 1;
    };

    return (
      signalScore(b.signal) - signalScore(a.signal) ||
      (b.volume || 0) - (a.volume || 0)
    );
  });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Volt Market Data</h1>

      <input
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        style={{ padding: "10px", marginRight: "10px" }}
      />

      <button onClick={getData} style={{ padding: "10px" }}>
        Get Data
      </button>

      {data && (
        <div style={{ marginTop: "24px" }}>
          <h2>{data.ticker}</h2>
          <p>Open: ${data.open}</p>
          <p>High: ${data.high}</p>
          <p>Low: ${data.low}</p>
          <p>Close: ${data.close}</p>
          <p>Volume: {data.volume}</p>
        </div>
      )}

      {sortedOptions.length > 0 && (
        <div style={{ marginTop: "32px", overflowX: "auto" }}>
          <h2>Options Activity Scanner</h2>
          <p>
            Showing near-the-money contracts, ranked by unusual activity and
            volume.
          </p>

          <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="all">All</option>
              <option value="call">Calls</option>
              <option value="put">Puts</option>
            </select>

            <select
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="all">All expirations</option>
              {expirations.map((expiration) => (
                <option key={expiration} value={expiration}>
                  {expiration}
                </option>
              ))}
            </select>
          </div>

          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "1200px",
            }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>Signal</th>
                <th style={cellStyle}>Contract</th>
                <th style={cellStyle}>Type</th>
                <th style={cellStyle}>Strike</th>
                <th style={cellStyle}>Exp</th>
                <th style={cellStyle}>Volume</th>
                <th style={cellStyle}>OI</th>
                <th style={cellStyle}>Vol/OI</th>
                <th style={cellStyle}>IV</th>
                <th style={cellStyle}>Delta</th>
                <th style={cellStyle}>Gamma</th>
                <th style={cellStyle}>Theta</th>
                <th style={cellStyle}>Vega</th>
              </tr>
            </thead>

            <tbody>
              {sortedOptions.map((option) => {
                const rowColor =
                  option.signal === "UNUSUAL"
                    ? "#ffcccc"
                    : option.signal === "WATCH"
                    ? "#fff3cd"
                    : "transparent";

                return (
                  <tr key={option.ticker} style={{ backgroundColor: rowColor }}>
                    <td style={cellStyle}>
                      <strong>{option.signal}</strong>
                    </td>
                    <td style={cellStyle}>{option.ticker}</td>
                    <td style={cellStyle}>{option.type}</td>
                    <td style={cellStyle}>${option.strike}</td>
                    <td style={cellStyle}>{option.expiration}</td>
                    <td style={cellStyle}>{option.volume ?? "-"}</td>
                    <td style={cellStyle}>{option.openInterest ?? "-"}</td>
                    <td style={cellStyle}>
                      {option.volumeOiRatio
                        ? option.volumeOiRatio.toFixed(2)
                        : "-"}
                    </td>
                    <td style={cellStyle}>
                      {option.impliedVolatility
                        ? `${(option.impliedVolatility * 100).toFixed(1)}%`
                        : "-"}
                    </td>
                    <td style={cellStyle}>
                      {option.delta?.toFixed?.(2) ?? "-"}
                    </td>
                    <td style={cellStyle}>
                      {option.gamma?.toFixed?.(4) ?? "-"}
                    </td>
                    <td style={cellStyle}>
                      {option.theta?.toFixed?.(2) ?? "-"}
                    </td>
                    <td style={cellStyle}>
                      {option.vega?.toFixed?.(2) ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left" as const,
};