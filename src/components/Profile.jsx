import React, { useEffect, useRef, useState } from "react";
import { User, Check, Sun, Moon, Globe, Phone, Mail, History, Camera, Image as ImageIcon } from "lucide-react";
import { T, btnPrimary, applyTheme } from "../lib/theme.js";
import { L, setLanguage } from "../lib/i18n.js";
import { Field, SectionLabel, Empty, Spinner } from "./primitives.jsx";
import { getAuth, setAuth, updateProfileApi, listTrips } from "../lib/api.js";
import { compressImageFile } from "../lib/utils.js";

export default function Profile() {
  const auth = getAuth();
  const [name, setName] = useState(auth?.user?.name || "");
  const [email, setEmail] = useState(auth?.user?.email || "");
  const [phone, setPhone] = useState(auth?.user?.phone || "");
  const [avatarPhoto, setAvatarPhoto] = useState(auth?.user?.avatarPhoto || null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("pusula_theme_mode") || "light"; } catch { return "light"; }
  });
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("pusula_lang") || "tr"; } catch { return "tr"; }
  });
  const [trips, setTrips] = useState(null);
  const [tripsError, setTripsError] = useState("");

  useEffect(() => {
    listTrips().then(setTrips).catch(e => setTripsError(e.message));
  }, []);

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

  const handleAvatarSelect = async (file) => {
    if (!file) return;
    setAvatarError("");
    if (!file.type.startsWith("image/")) { setAvatarError("Sadece görsel dosyası yükleyebilirsin."); return; }
    setAvatarBusy(true);
    try {
      const dataUrl = await compressImageFile(file, 400, 0.75); // profile photos can be smaller than receipts
      const { user } = await updateProfileApi({ avatarPhoto: dataUrl });
      setAvatarPhoto(user.avatarPhoto);
      setAuth({ ...auth, user: { ...auth.user, avatarPhoto: user.avatarPhoto } });
    } catch (e) {
      setAvatarError(e.message || "Fotoğraf yüklenemedi.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const save = async () => {
    setError(""); setSaved(false);
    if (!name.trim()) { setError("İsim boş olamaz."); return; }
    setBusy(true);
    try {
      const { user } = await updateProfileApi({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      setAuth({ ...auth, user: { ...auth.user, name: user.name, phone: user.phone, email: user.email } });
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
        <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => handleAvatarSelect(e.target.files?.[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" style={{ display: "none" }}
          onChange={e => handleAvatarSelect(e.target.files?.[0])} />

        <div style={{
          width: 76, height: 76, borderRadius: "50%", margin: "0 auto 10px", background: "rgba(255,255,255,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative",
        }}>
          {avatarBusy ? <Spinner label="" /> : avatarPhoto ? (
            <img src={avatarPhoto} alt="Profil fotoğrafı" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={32} color="#FFF9F0" />
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 4 }}>
          <button onClick={() => galleryInputRef.current?.click()} disabled={avatarBusy} style={{
            display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.16)", border: "none",
            borderRadius: 20, padding: "6px 12px", color: "#FFF9F0", fontSize: 11.5, cursor: "pointer",
          }}><ImageIcon size={12} /> Galeriden Seç</button>
          <button onClick={() => cameraInputRef.current?.click()} disabled={avatarBusy} style={{
            display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.16)", border: "none",
            borderRadius: 20, padding: "6px 12px", color: "#FFF9F0", fontSize: 11.5, cursor: "pointer",
          }}><Camera size={12} /> Kamera</button>
        </div>
        {avatarError && <div style={{ color: "#FFB3AD", fontSize: 11, marginBottom: 4 }}>{avatarError}</div>}

        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 19, fontWeight: 600, color: "#FFF9F0", marginTop: 8 }}>{auth?.user?.name}</div>
        {auth?.user?.email && <div style={{ fontSize: 12, color: "rgba(255,249,240,0.75)", marginTop: 4 }}>{auth.user.email}</div>}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, boxShadow: T.shadowSoft }}>
        <Field label="Görünen adın" value={name} onChange={setName} placeholder="Adın" />
        <Field label="E-posta" value={email} onChange={setEmail} placeholder="ornek@eposta.com" type="email" />
        <Field label="Telefon numarası" value={phone} onChange={setPhone} placeholder="+90 5xx xxx xx xx" type="tel" />
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

      <SectionLabel icon={History}>Seyahat Geçmişim</SectionLabel>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: trips?.length ? 6 : 16, boxShadow: T.shadowSoft }}>
        {tripsError && <Empty text={`Geçmiş alınamadı: ${tripsError}`} />}
        {!tripsError && trips === null && <Spinner label="Yükleniyor..." />}
        {!tripsError && trips?.length === 0 && <Empty text="Henüz bir seyahatin yok." />}
        {trips?.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber, flexShrink: 0 }}>
              <History size={15} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{t.city}, {t.country}</div>
            </div>
            <div style={{ fontSize: 10.5, color: T.muted, flexShrink: 0 }}>
              {t.createdAt ? new Date(t.createdAt).toLocaleDateString("tr-TR") : ""}
            </div>
          </div>
        ))}
      </div>

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
