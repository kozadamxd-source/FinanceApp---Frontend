"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Portfolio() {
  const [user, setUser] = useState(null);
  const [positions, setPositions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", shares: "", buy_price: "" });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = { current: null };

  // Sprawdź sesję
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
      else {
        setUser(session.user);
        loadPositions(session.user.id);
      }
    });
  }, []);

  // Pobierz pozycje z Supabase
  const loadPositions = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setPositions(data || []);
      fetchPrices(data || []);
    }
    setLoading(false);
  };

  // Pobierz aktualne kursy dla wszystkich pozycji
  const fetchPrices = async (pos) => {
    if (!pos.length) return;
    const unique = [...new Set(pos.map((p) => p.symbol))];
    const results = {};
    await Promise.all(
      unique.map(async (symbol) => {
        try {
          const res = await fetch(`${API}/history?symbol=${symbol}&days=5`);
          const data = await res.json();
          if (data.current_price) {
            results[symbol] = data.current_price;
          }
        } catch {
          results[symbol] = null;
        }
      })
    );
    setPrices(results);
  };

  // Autocomplete
  const handleSymbolInput = (val) => {
    setForm((f) => ({ ...f, symbol: val }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?q=${val}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const selectSuggestion = (s) => {
    setForm((f) => ({ ...f, symbol: s.symbol_bankier }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Dodaj pozycję
  const addPosition = async () => {
    if (!form.symbol || !form.shares || !form.buy_price) {
      setError("Wypełnij wszystkie pola");
      return;
    }
    setAddLoading(true);
    setError(null);
    const { error } = await supabase.from("portfolio").insert({
      user_id: user.id,
      symbol: form.symbol.toUpperCase(),
      shares: parseFloat(form.shares),
      buy_price: parseFloat(form.buy_price),
    });
    if (error) setError(error.message);
    else {
      setForm({ symbol: "", shares: "", buy_price: "" });
      setShowForm(false);
      loadPositions(user.id);
    }
    setAddLoading(false);
  };

  // Usuń pozycję
  const deletePosition = async (id) => {
    await supabase.from("portfolio").delete().eq("id", id);
    loadPositions(user.id);
  };

  // Oblicz wartości
  const calcPosition = (pos) => {
    const currentPrice = prices[pos.symbol];
    if (!currentPrice) return null;
    const currentValue = currentPrice * pos.shares;
    const buyValue = pos.buy_price * pos.shares;
    const pnl = currentValue - buyValue;
    const pnlPct = ((pnl / buyValue) * 100).toFixed(2);
    return { currentPrice, currentValue, buyValue, pnl, pnlPct };
  };

  const totalValue = positions.reduce((sum, pos) => {
    const calc = calcPosition(pos);
    return sum + (calc ? calc.currentValue : pos.buy_price * pos.shares);
  }, 0);

  const totalBuyValue = positions.reduce((sum, pos) => sum + pos.buy_price * pos.shares, 0);
  const totalPnl = totalValue - totalBuyValue;
  const totalPnlPct = totalBuyValue ? ((totalPnl / totalBuyValue) * 100).toFixed(2) : 0;

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (!user) return null;

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
            style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: item.href === "/portfolio" ? "#a78bfa" : "#888", background: item.href === "/portfolio" ? "#2d2a4a" : "transparent", cursor: "pointer" }}
          >
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: "#888", cursor: "pointer" }}>Ustawienia</div>
          <div onClick={logout} style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, color: "#f87171", cursor: "pointer" }}>Wyloguj</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500 }}>Portfel</h1>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}
          >
            + Dodaj spółkę
          </button>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13 }}>Błąd: {error}</div>}

        {/* Formularz dodawania */}
        {showForm && (
          <div style={{ background: "#1a1829", borderRadius: 12, padding: 20, border: "0.5px solid #2a2840" }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: "#ddd" }}>Nowa pozycja</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              {/* Symbol z autocomplete */}
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Symbol spółki</div>
                <input
                  placeholder="np. KGHM"
                  value={form.symbol}
                  onChange={(e) => handleSymbolInput(e.target.value.toUpperCase())}
                  style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e1c30", border: "0.5px solid #2d2b45", borderRadius: 8, marginTop: 4, zIndex: 100, overflow: "hidden" }}>
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => selectSuggestion(s)}
                        style={{ padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: 13 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#2d2a4a"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ color: "#fff" }}>{s.name}</span>
                        <span style={{ color: "#a78bfa" }}>{s.symbol_bankier}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Liczba akcji</div>
                <input
                  type="number"
                  placeholder="np. 10"
                  value={form.shares}
                  onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
                  style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Cena zakupu (PLN)</div>
                <input
                  type="number"
                  placeholder="np. 340.50"
                  value={form.buy_price}
                  onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
                  style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={addPosition}
                disabled={addLoading}
                style={{ background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", height: 36 }}
              >
                {addLoading ? "..." : "Dodaj"}
              </button>
            </div>
          </div>
        )}

        {/* Karty podsumowania */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { label: "Łączna wartość", value: `${totalValue.toFixed(2)} PLN` },
            { label: "Zainwestowano", value: `${totalBuyValue.toFixed(2)} PLN` },
            { label: "Zysk / Strata", value: `${totalPnl.toFixed(2)} PLN (${totalPnlPct}%)`, color: totalPnl >= 0 ? "#34d399" : "#f87171" },
          ].map((card, i) => (
            <div key={i} style={{ background: "#1a1829", borderRadius: 12, padding: 16, border: "0.5px solid #2a2840" }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: card.color || "#fff" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Tabela pozycji */}
        <div style={{ background: "#1a1829", borderRadius: 12, border: "0.5px solid #2a2840", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #2a2840", fontSize: 14, fontWeight: 500, color: "#ddd" }}>
            Pozycje ({positions.length})
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>Ładowanie...</div>
          ) : positions.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>
              Brak pozycji — dodaj pierwszą spółkę klikając "+ Dodaj spółkę"
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #2a2840" }}>
                  {["Symbol", "Akcje", "Cena zakupu", "Aktualny kurs", "Wartość", "Zysk/Strata", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const calc = calcPosition(pos);
                  return (
                    <tr key={pos.id} style={{ borderBottom: "0.5px solid #1e1c30" }}>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 500, color: "#a78bfa" }}>{pos.symbol}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#ddd" }}>{pos.shares}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#ddd" }}>{pos.buy_price.toFixed(2)} PLN</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#ddd" }}>
                        {calc ? `${calc.currentPrice.toFixed(2)} PLN` : <span style={{ color: "#555" }}>Ładowanie...</span>}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#ddd" }}>
                        {calc ? `${calc.currentValue.toFixed(2)} PLN` : "—"}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: calc ? (calc.pnl >= 0 ? "#34d399" : "#f87171") : "#555" }}>
                        {calc ? `${calc.pnl.toFixed(2)} PLN (${calc.pnlPct}%)` : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => deletePosition(pos.id)}
                          style={{ background: "transparent", border: "0.5px solid #2a2840", borderRadius: 6, padding: "4px 10px", color: "#f87171", fontSize: 12, cursor: "pointer" }}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}