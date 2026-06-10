"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [user, setUser] = useState(null);
  const [symbol, setSymbol] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sprawdź sesję przy załadowaniu
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
      } else {
        setUser(session.user);
      }
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Zamknij dropdown po kliknięciu poza
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce search
  const handleInput = (val) => {
    setSymbol(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?q=${val}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectSuggestion = (s) => {
    setSymbol(s.symbol_bankier);
    setShowSuggestions(false);
    setSuggestions([]);
    loadData(s.symbol_bankier);
  };

  const loadData = async (sym) => {
    const s = (sym || symbol).trim().toUpperCase();
    if (!s) return;
    setLoading(true);
    setError(null);
    setMetrics(null);
    setHistory(null);

    try {
      const [mRes, hRes] = await Promise.all([
        fetch(`${API}/metrics?symbol=${s}`),
        fetch(`${API}/history?symbol=${s}&days=30`),
      ]);
      if (!mRes.ok) throw new Error(`Błąd metrics: ${mRes.status}`);
      if (!hRes.ok) throw new Error(`Błąd history: ${hRes.status}`);
      const [m, h] = await Promise.all([mRes.json(), hRes.json()]);
      setMetrics(m);
      setHistory(h);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!history || !chartRef.current) return;
    const loadChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      if (chartInstance.current) chartInstance.current.destroy();
      const labels = history.history.map((d) => d.date);
      const closes = history.history.map((d) => d.close);
      const first = closes[0];
      const last = closes[closes.length - 1];
      const color = last >= first ? "#34d399" : "#f87171";
      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Kurs zamknięcia",
            data: closes,
            borderColor: color,
            backgroundColor: color + "22",
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(2)} PLN` } },
          },
          scales: {
            x: { ticks: { color: "#666", maxTicksLimit: 6, font: { size: 11 } }, grid: { color: "#1e1c30" } },
            y: { ticks: { color: "#666", font: { size: 11 }, callback: (v) => v.toFixed(0) + " PLN" }, grid: { color: "#1e1c30" } },
          },
        },
      });
    };
    loadChart();
  }, [history]);

  const fmt = (val, suffix = "") => val != null ? val.toFixed(2) + suffix : "—";

  const peRating = (pe) => {
    if (!pe) return { label: "Brak danych", color: "#666" };
    if (pe < 10) return { label: "Niedowartościowana", color: "#34d399" };
    if (pe < 20) return { label: "Atrakcyjna", color: "#34d399" };
    if (pe < 30) return { label: "Neutralna", color: "#facc15" };
    return { label: "Droga", color: "#f87171" };
  };

  const priceChange = history
    ? (((history.history[history.history.length - 1].close - history.history[0].close) / history.history[0].close) * 100).toFixed(2)
    : null;

  if (!user) return null; // Czeka na sprawdzenie sesji

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f0e1a", color: "#fff", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 180, background: "#13121f", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#a78bfa" }}>📈</span> FinanceApp
        </div>
        {[
          { label: "Dashboard", href: "/" },
          { label: "Spółki", href: "/spolki" },
          { label: "Portfel", href: "/portfolio" },
          { label: "Obserwowane", href: "/watchlist" },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => window.location.href = item.href}
            style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: item.href === "/" ? "#a78bfa" : "#888", background: item.href === "/" ? "#2d2a4a" : "transparent", cursor: "pointer" }}
          >
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: "#888", cursor: "pointer" }}>
            Ustawienia
          </div>
          <div
            onClick={logout}
            style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: "#f87171", cursor: "pointer" }}
          >
            Wyloguj
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500 }}>Dashboard</h1>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{user.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8, position: "relative" }} ref={wrapperRef}>
            <div style={{ position: "relative" }}>
              <input
                placeholder="Szukaj spółki..."
                value={symbol}
                onChange={(e) => handleInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); loadData(); } }}
                style={{ background: "#1e1c30", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 13, width: 240, outline: "none" }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e1c30", border: "0.5px solid #2d2b45", borderRadius: 8, marginTop: 4, zIndex: 100, overflow: "hidden" }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      style={{ padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < suggestions.length - 1 ? "0.5px solid #2a2840" : "none" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#2d2a4a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 13, color: "#fff" }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: "#a78bfa", marginLeft: 8 }}>{s.symbol_bankier}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowSuggestions(false); loadData(); }}
              style={{ background: "#7c3aed", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}
            >
              {loading ? "..." : "Pobierz"}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13 }}>Błąd: {error}</div>}

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { label: "Aktualny kurs", value: history ? `${history.current_price} PLN` : "—" },
            { label: "Zmiana 30d", value: priceChange ? `${priceChange}%` : "—", color: priceChange > 0 ? "#34d399" : "#f87171" },
            { label: "52T max", value: history ? `${history.week_high_52} PLN` : "—" },
            { label: "52T min", value: history ? `${history.week_low_52} PLN` : "—" },
          ].map((card, i) => (
            <div key={i} style={{ background: "#1a1829", borderRadius: 12, padding: 16, border: "0.5px solid #2a2840" }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: card.color || "#fff" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Chart + indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "#1a1829", borderRadius: 12, padding: 18, border: "0.5px solid #2a2840" }}>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 4 }}>Kurs zamknięcia — ostatnie 30 sesji</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>
              {history ? history.symbol : "—"}
              {history?.current_price && <span style={{ marginLeft: 12, color: "#a78bfa" }}>{history.current_price} PLN</span>}
            </div>
            <div style={{ height: 200, position: "relative" }}>
              <canvas ref={chartRef} />
              {!history && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 13 }}>Brak danych</div>}
            </div>
          </div>

          <div style={{ background: "#1a1829", borderRadius: 12, padding: 18, border: "0.5px solid #2a2840" }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "#ddd" }}>Wskaźniki fundamentalne</div>
            {[
              { label: "C/Z (P/E)", value: fmt(metrics?.pe) },
              { label: "C/WK (P/BV)", value: fmt(metrics?.pbv) },
              { label: "ROE", value: fmt(metrics?.roe, "%") },
              { label: "Marża netto", value: fmt(metrics?.net_margin, "%") },
              { label: "Stopa dywidendy", value: fmt(metrics?.dividend_yield, "%") },
              { label: "Ocena wyceny", value: metrics ? peRating(metrics.pe).label : "—", color: metrics ? peRating(metrics.pe).color : "#666" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 5 ? "0.5px solid #22203a" : "none", fontSize: 13 }}>
                <span style={{ color: "#888" }}>{row.label}</span>
                <span style={{ color: row.color || "#fff", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}