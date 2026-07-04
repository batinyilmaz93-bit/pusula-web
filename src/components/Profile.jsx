import React, { useState } from "react";
import { User, Check } from "lucide-react";
import { T, btnPrimary } from "../lib/theme.js";
import { Field } from "./primitives.jsx";
import { getAuth, setAuth, updateProfileApi } from "../lib/api.js";

export default function Profile() {
  const auth = getAuth();
  const [name, setName] = useState(auth?.user?.name || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError(""); setSaved(false);
    if (!name.trim()) { setError("İsim boş olamaz."); return; }
    setBusy(true);
    try {
      const { user } = await updateProfileApi(name.trim());
      setAuth({ ...auth, user: { ...auth.user, name: user.name } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${T.navy}, #1A2E47)`, borderRadius: 20, padding: 20,
        boxShadow: T.shadow, textAlign: "center", marginBottom: 18,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", background: "rgba(255,255,255,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <User size={28} color="#FFF9F0" />
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 19, fontWeight: 600, color: "#FFF9F0" }}>{auth?.user?.name}</div>
        {auth?.user?.email && <div style={{ fontSize: 12, color: "rgba(255,249,240,0.75)", marginTop: 4 }}>{auth.user.email}</div>}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, boxShadow: T.shadowSoft }}>
        <Field label="Görünen adın" value={name} onChange={setName} placeholder="Adın" />
        {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={save} disabled={busy} style={{ ...btnPrimary, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {saved ? <><Check size={15} /> Kaydedildi</> : busy ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {!auth?.user?.email && (
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 14, textAlign: "center" }}>
          Bu hesap eski (e-postasız) bir oturum — şifre sıfırlama gibi özellikler için çıkış yapıp e-posta ile kayıt olman gerekir.
        </div>
      )}
    </div>
  );
}
