"use client";
import { useState } from "react";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/metrics?symbol=${symbol}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `Błąd ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchMetrics();
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        Dashboard Wskaźników Finansowych
      </h1>
      <input
        placeholder="Wpisz symbol, np. CDPROJEKT, KGHM, PKN"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ padding: 10, width: "100%", fontSize: 18, marginBottom: 20 }}
      />
      <button
        onClick={fetchMetrics}
        style={{
          padding: "10px 20px",
          fontSize: 18,
          cursor: "pointer",
          background: "black",
          color: "white",
          borderRadius: 6,
        }}
      >
        Pobierz dane
      </button>

      {loading && <p>Ładowanie...</p>}
      {error && <p style={{ color: "red", marginTop: 20 }}>Błąd: {error}</p>}

      {data && (
        <div style={{ marginTop: 30 }}>
          <h2>Wyniki dla: {data.symbol}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginTop: 20,
            }}
          >
            <Card label="C/Z (P/E)" value={data.pe} />
            <Card label="C/WK (P/BV)" value={data.pbv} />
            <Card label="ROE" value={data.roe != null ? `${data.roe}%` : null} />
            <Card label="Marża netto" value={data.net_margin != null ? `${data.net_margin}%` : null} />
            <Card label="Stopa dywidendy" value={data.dividend_yield != null ? `${data.dividend_yield}%` : null} />
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div
      style={{
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <h3 style={{ marginBottom: 10 }}>{label}</h3>
      <p style={{ fontSize: 20, fontWeight: "bold" }}>{value ?? "—"}</p>
    </div>
  );
}