"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handle = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Sprawdź maila i kliknij link weryfikacyjny!");

    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Link do resetu hasła został wysłany na Twój email!");

    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/";
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f0e1a", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#1a1829", border: "0.5px solid #2a2840", borderRadius: 16, padding: 40, width: 360 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 8 }}>
          📈 FinanceApp
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>
          {mode === "login" && "Zaloguj się do swojego konta"}
          {mode === "register" && "Utwórz nowe konto"}
          {mode === "reset" && "Resetuj hasło"}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="twoj@email.com"
            style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {mode !== "reset" && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Hasło</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{ width: "100%", background: "#13121f", border: "0.5px solid #2d2b45", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}

        {mode === "reset" && <div style={{ marginBottom: 24 }} />}

        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ color: "#34d399", fontSize: 12, marginBottom: 16 }}>{message}</div>}

        <button
          onClick={handle}
          disabled={loading}
          style={{ width: "100%", background: "#7c3aed", border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontSize: 14, cursor: "pointer", marginBottom: 16 }}
        >
          {loading ? "..." : mode === "login" ? "Zaloguj się" : mode === "register" ? "Zarejestruj się" : "Wyślij link resetujący"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {mode === "login" && (
            <>
              <span
                onClick={() => { setMode("reset"); setError(null); setMessage(null); }}
                style={{ fontSize: 13, color: "#a78bfa", cursor: "pointer" }}
              >
                Zapomniałem hasła
              </span>
              <span style={{ fontSize: 13, color: "#888" }}>
                Nie masz konta?{" "}
                <span
                  onClick={() => { setMode("register"); setError(null); setMessage(null); }}
                  style={{ color: "#a78bfa", cursor: "pointer" }}
                >
                  Zarejestruj się
                </span>
              </span>
            </>
          )}
          {(mode === "register" || mode === "reset") && (
            <span style={{ fontSize: 13, color: "#888" }}>
              <span
                onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                style={{ color: "#a78bfa", cursor: "pointer" }}
              >
                ← Wróć do logowania
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}