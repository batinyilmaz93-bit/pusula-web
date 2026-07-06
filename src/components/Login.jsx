import React, { useState } from "react";
import { Compass, Sun, ArrowLeft } from "lucide-react";
import { T, btnPrimary } from "../lib/theme.js";
import { Field } from "./primitives.jsx";
import { registerApi, loginApi, requestResetApi, confirmResetApi, setAuth } from "../lib/api.js";
import { APP_VERSION } from "../lib/version.js";

export default function Login({ onReady, message, initialResetToken }) {
  // "login" | "register" | "forgot" | "reset"
  const [mode, setMode] = useState(initialResetToken ? "reset" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submitLoginOrRegister = async () => {
    setError(""); setInfo("");
    if (!email.trim() || !password) { setError("E-posta ve şifre gerekli."); return; }
    if (mode === "register" && !name.trim()) { setError("İsim gerekli."); return; }
    setBusy(true);
    try {
      const { token, user } = mode === "register"
        ? await registerApi(email.trim(), password, name.trim())
        : await loginApi(email.trim(), password);
      setAuth({ token, user });
      onReady();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async () => {
    setError(""); setInfo("");
    if (!email.trim()) { setError("E-posta gerekli."); return; }
    setBusy(true);
    try {
      const res = await requestResetApi(email.trim());
      setInfo(res.message);
      if (res.devLink) {
        // Only present when no email service is configured server-side —
        // lets the flow be tested end-to-end without real email delivery.
        setInfo(res.message + " (E-posta servisi henüz kurulmadığı için test bağlantısı: " + res.devLink + ")");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async () => {
    setError(""); setInfo("");
    if (!password || password.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    if (password !== password2) { setError("Şifreler eşleşmiyor."); return; }
    setBusy(true);
    try {
      const { token, user } = await confirmResetApi(initialResetToken, password);
      setAuth({ token, user });
      onReady();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const titles = { login: "Pusula'ya hoş geldin", register: "Pusula'ya hoş geldin", forgot: "Şifreni mi unuttun?", reset: "Yeni şifre belirle" };
  const subtitles = {
    login: "Seyahat arkadaşlarınla ortak bütçeyi, planı ve merakı tek yerde toplayalım.",
    register: "Seyahat arkadaşlarınla ortak bütçeyi, planı ve merakı tek yerde toplayalım.",
    forgot: "E-postanı gir, sıfırlama bağlantısı gönderelim.",
    reset: "Hesabın için yeni bir şifre belirle.",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "calc(24px + env(safe-area-inset-top)) 28px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 18px",
            background: `linear-gradient(150deg, ${T.amber}, #B8863C)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(107,142,78,0.32)",
          }}>
            <Compass size={32} color="#FFF9F0" strokeWidth={1.8} />
          </div>
          <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 26, fontWeight: 800, color: T.text }}>
            {titles[mode]}
          </div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 8, lineHeight: 1.5, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            {subtitles[mode]}
          </div>
        </div>

        <div style={{ background: T.card, borderRadius: 20, padding: 20, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
        {(mode === "login" || mode === "register") && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, background: T.cardAlt, borderRadius: 12, padding: 4 }}>
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
              background: mode === "login" ? T.amber : "transparent", color: mode === "login" ? "#FFF9F0" : T.muted, fontWeight: 600, fontSize: 13.5,
            }}>Giriş Yap</button>
            <button onClick={() => { setMode("register"); setError(""); setInfo(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
              background: mode === "register" ? T.amber : "transparent", color: mode === "register" ? "#FFF9F0" : T.muted, fontWeight: 600, fontSize: 13.5,
            }}>Kayıt Ol</button>
          </div>
        )}

        {(mode === "login" || mode === "register") && (
          <>
            {mode === "register" && <Field label="Adın" value={name} onChange={setName} placeholder="Örn. Batın" />}
            <Field label="E-posta" value={email} onChange={setEmail} placeholder="ornek@eposta.com" type="email" />
            <Field label="Şifre" value={password} onChange={setPassword} placeholder="En az 6 karakter" type="password" />
            {mode === "login" && (
              <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: T.teal, fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 12 }}>
                Şifremi unuttum
              </button>
            )}
          </>
        )}

        {mode === "forgot" && (
          <>
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.muted, fontSize: 12.5, cursor: "pointer", padding: 0, marginBottom: 14 }}>
              <ArrowLeft size={13} /> Girişe dön
            </button>
            <Field label="E-posta" value={email} onChange={setEmail} placeholder="ornek@eposta.com" type="email" />
          </>
        )}

        {mode === "reset" && (
          <>
            <Field label="Yeni şifre" value={password} onChange={setPassword} placeholder="En az 6 karakter" type="password" />
            <Field label="Yeni şifre (tekrar)" value={password2} onChange={setPassword2} placeholder="Tekrar gir" type="password" />
          </>
        )}

        {message && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.amber, fontSize: 12, marginBottom: 10 }}>
            <Sun size={13} /> {message}
          </div>
        )}
        {info && <div style={{ color: T.teal, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{info}</div>}
        {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <button
          onClick={mode === "forgot" ? submitForgot : mode === "reset" ? submitReset : submitLoginOrRegister}
          disabled={busy}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: T.amber, color: "#FFF9F0", fontWeight: 600, fontSize: 14.5, fontFamily: "'Libre Baskerville',sans-serif", cursor: "pointer", opacity: busy ? 0.75 : 1 }}
        >
          {busy ? "Bağlanıyor..." :
            mode === "register" ? "Hesap Oluştur" :
            mode === "forgot" ? "Sıfırlama Bağlantısı Gönder" :
            mode === "reset" ? "Şifreyi Güncelle" : "Giriş Yap"}
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
