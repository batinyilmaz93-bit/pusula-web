import React, { useState } from "react";
import { Compass } from "lucide-react";
import { T, btnPrimary } from "../lib/theme.js";
import { Field } from "./primitives.jsx";
import { registerDevice, setAuth } from "../lib/api.js";

export default function NameGate({ onReady }) {
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
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Compass size={30} color={T.amber} />
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 24, fontWeight: 600 }}>Pusula'ya hoş geldin</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>Seyahat arkadaşlarının seni tanıması için bir isim yeter — şifre yok.</div>
      </div>
      <Field label="Adın" value={name} onChange={setName} placeholder="Örn. Batın" />
      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <button onClick={submit} disabled={busy || !name.trim()} style={{ ...btnPrimary, width: "100%", opacity: busy ? 0.7 : 1 }}>
        {busy ? "Bağlanıyor..." : "Devam et"}
      </button>
    </div>
  );
}
