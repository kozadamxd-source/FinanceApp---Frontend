"use client";

import { useState } from "react";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/metrics?symbol=${symbol}`
    );
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        Dashboard Wskaźników Finansowych
      </h1>

      <input
        placeholder="Wpisz ticker, np. CDPROJEKT"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        style={{
          padding: 10,
          width: "100%",
          fontSize: 18,
          marginBottom: 20,
        }}
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
            <Card label="C/Z" value={data.pe} />
            <Card label="EV/EBITDA" value={data.ev_ebitda} />
            <Card label="Zadłużenie" value={data.debt_ratio} />
            <Card label="Płynność bieżąca" value={data.current_ratio} />
            <Card label="Płynność szybka" value={data.quick_ratio} />
            <Card
              label="Należności / Zobowiązania"
              value={data.receivables_to_liabilities}
            />
            <Card label="Złota reguła" value={String(data.golden_rule)} />
            <Card label="Srebrna reguła" value={String(data.silver_rule)} />
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
      <p style={{ fontSize: 20, fontWeight: "bold" }}>{value || "—"}</p>
    </div>
  );
}
