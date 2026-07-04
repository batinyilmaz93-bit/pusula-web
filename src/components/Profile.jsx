import React, { useState } from "react";
import { User, Check, Sun, Moon, Globe } from "lucide-react";
import { T, btnPrimary, applyTheme } from "../lib/theme.js";
import { L, setLanguage } from "../lib/i18n.js";
import { Field, SectionLabel } from "./primitives.jsx";
import { getAuth, setAuth, updateProfileApi } from "../lib/api.js";

export default function Profile() {
  const auth = getAuth();
  const [name, setName] = useState(auth?.user?.name || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("pusula_theme_mode") || "light"; } catch { return "light"; }
  });
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("pusula_lang") || "tr"; } catch { return "tr"; }
  });

  const changeTheme = (newMode) => {
    applyTheme(newMode);
    try { localStorage.setItem("pusula_theme_mode", newMode); } catch { /* ignore */ }
    setMode(newMode);
  };
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    try { localStorage.setItem("pusula_lang", newLang); } catch { /* ignore */ }
    setLang(newLang);
  };

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

      <SectionLabel icon={Sun}>{L.appearance}</SectionLabel>
      <div style={{ display: "flex", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 6, boxShadow: T.shadowSoft }}>
        <button onClick={() => changeTheme("light")} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          background: mode === "light" ? T.amber : "transparent", color: mode === "light" ? T.buttonTextOnAccent || "#FFF9F0" : T.muted, fontWeight: 600, fontSize: 13.5,
        }}><Sun size={15} /> {L.light}</button>
        <button onClick={() => changeTheme("dark")} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          background: mode === "dark" ? T.amber : "transparent", color: mode === "dark" ? "#101820" : T.muted, fontWeight: 600, fontSize: 13.5,
        }}><Moon size={15} /> {L.dark}</button>
      </div>

      <SectionLabel icon={Globe}>{L.language}</SectionLabel>
      <div style={{ display: "flex", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 6, boxShadow: T.shadowSoft }}>
        <button onClick={() => changeLanguage("tr")} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          background: lang === "tr" ? T.amber : "transparent", color: lang === "tr" ? (T.buttonTextOnAccent || "#FFF9F0") : T.muted, fontWeight: 600, fontSize: 13.5,
        }}>Türkçe</button>
        <button onClick={() => changeLanguage("en")} style={{
          flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          background: lang === "en" ? T.amber : "transparent", color: lang === "en" ? (T.buttonTextOnAccent || "#FFF9F0") : T.muted, fontWeight: 600, fontSize: 13.5,
        }}>English</button>
      </div>
      <div style={{ fontSize: 10.5, color: T.muted, marginTop: 8, textAlign: "center", lineHeight: 1.5 }}>
        Şu an sadece menü/başlık gibi ana metinler çevriliyor, her açıklama metni değil.
      </div>
    </div>
  );
}
