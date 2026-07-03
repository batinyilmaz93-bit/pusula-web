import React, { useState } from "react";
import { Compass, Sun } from "lucide-react";
import { T } from "../lib/theme.js";
import { Field } from "./primitives.jsx";
import { registerDevice, setAuth } from "../lib/api.js";
import { APP_VERSION } from "../lib/version.js";

export default function NameGate({ onReady, message }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true); setError("");
    try {
      const { token, user } = await registerDevice(n);
      setAuth({ token, user });
      onReady();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "calc(24px + env(safe-area-inset-top)) 28px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 18px",
          background: `linear-gradient(150deg, ${T.amber}, #F2A65A)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 18px rgba(226,104,61,0.32)",
        }}>
          <Compass size={32} color="#FFF9F0" strokeWidth={1.8} />
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 26, fontWeight: 600, color: T.text }}>
          Pusula'ya hoş geldin
        </div>
        <div style={{ fontSize: 13.5, color: T.muted, marginTop: 8, lineHeight: 1.5, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
          Seyahat arkadaşlarınla ortak bütçeyi, planı ve merakı tek yerde toplayalım. Tek ihtiyacımız olan, seni tanıyabilmemiz için bir isim — şifre falan yok.
        </div>
      </div>

      <div style={{ background: T.card, borderRadius: 20, padding: 20, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
        <Field label="Adın ne olsun?" value={name} onChange={setName} placeholder="Örn. Batın" />
        {message && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.amber, fontSize: 12, marginBottom: 10 }}>
            <Sun size={13} /> {message}
          </div>
        )}
        {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={submit} disabled={busy || !name.trim()} style={{
          width: "100%", padding: "12px", borderRadius: 12, border: "none",
          background: name.trim() ? T.amber : T.dash, color: "#FFF9F0",
          fontWeight: 600, fontSize: 14.5, fontFamily: "'Inter',sans-serif",
          cursor: name.trim() ? "pointer" : "default", opacity: busy ? 0.75 : 1,
          transition: "background 0.15s ease",
        }}>
          {busy ? "Bağlanıyor..." : "Devam et"}
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: T.muted, marginTop: 18 }}>
        İyi seyahatler ✈️
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: T.muted, opacity: 0.5, marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>
        sürüm: {APP_VERSION}
      </div>
    </div>
  );
}
