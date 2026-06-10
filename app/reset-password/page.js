"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMessage("Hasło zostało zmienione! Przekierowuję...");
      setTimeout(() => window.location.href = "/login", 2000);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f0e1a", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#1a1829", border: "0.5px solid #2a2840", borderRadius: 16, padding: 40, width: 360 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 8 }}>📈 FinanceApp</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>Ustaw nowe hasło</div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Nowe hasło</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handle()}
            style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ color: "#34d399", fontSize: 12, marginBottom: 16 }}>{message}</div>}

        <button
          onClick={handle}
          disabled={loading}
          style={{ width: "100%", background: "#7c3aed", border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontSize: 14, cursor: "pointer" }}
        >
          {loading ? "..." : "Zmień hasło"}
        </button>
      </div>
    </div>
  );
}