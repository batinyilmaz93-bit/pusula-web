import React, { useEffect, useRef, useState } from "react";
import { Send, MapPin, MessageCircle, AlertTriangle, Camera, Image as ImageIcon, Navigation, X } from "lucide-react";
import { T } from "../lib/theme.js";
import { L } from "../lib/i18n.js";
import { Spinner, Empty } from "./primitives.jsx";
import { getMessagesApi, sendMessageApi, getAuth } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";
import { fmtTime, compressImageFile } from "../lib/utils.js";

const LIVE_INTERVAL_MS = 45_000; // how often a periodic update goes out
const LIVE_DURATION_MS = 15 * 60_000; // auto-stop after 15 minutes — this
// is "live for a while", not an always-on background tracker (a PWA
// realistically can't keep a geolocation watch running once it's fully
// backgrounded/closed anyway, so promising more than this would be
// misleading).

export default function ChatTab({ trip, myMemberId }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [liveOn, setLiveOn] = useState(false);
  const scrollRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const liveIntervalRef = useRef(null);
  const liveTimeoutRef = useRef(null);

  useEffect(() => {
    getMessagesApi(trip.id).then(r => setMessages(r.messages)).catch(e => setError(e.message));
  }, [trip.id]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (msg) => {
      if (msg.tripId !== trip.id) return;
      setMessages(prev => (prev || []).some(m => m.id === msg.id) ? prev : [...(prev || []), msg]);
    };
    socket.on("trip:message", onMessage);
    return () => socket.off("trip:message", onMessage);
  }, [trip.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Stop the live loop if the user navigates away from chat entirely.
  useEffect(() => () => stopLiveLocation(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const getPosition = () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });

  const stopLiveLocation = () => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    liveIntervalRef.current = null;
    liveTimeoutRef.current = null;
    setLiveOn(false);
  };

  const startLiveLocation = async () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Bu tarayıcı konum paylaşmayı desteklemiyor."); return; }
    try {
      const first = await getPosition();
      await sendMessageApi(trip.id, { kind: "location", lat: first.coords.latitude, lon: first.coords.longitude, live: false });
      setLiveOn(true);
      liveIntervalRef.current = setInterval(async () => {
        try {
          const pos = await getPosition();
          await sendMessageApi(trip.id, { kind: "location", lat: pos.coords.latitude, lon: pos.coords.longitude, live: true });
        } catch { /* a single missed tick isn't worth surfacing an error for */ }
      }, LIVE_INTERVAL_MS);
      liveTimeoutRef.current = setTimeout(stopLiveLocation, LIVE_DURATION_MS);
    } catch (err) {
      if (err.code === err?.PERMISSION_DENIED) setLocError("Konum izni reddedildi — tarayıcı ayarlarından izin vermen gerekiyor.");
      else setLocError("Konum alınamadı: " + (err.message || "bilinmeyen hata"));
    }
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      await sendMessageApi(trip.id, { kind: "text", text: t });
      setText("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const shareLocation = () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Bu tarayıcı konum paylaşmayı desteklemiyor."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await sendMessageApi(trip.id, { kind: "location", lat: pos.coords.latitude, lon: pos.coords.longitude });
        } catch (e) {
          setLocError(e.message);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setLocError("Konum izni reddedildi — tarayıcı ayarlarından izin vermen gerekiyor.");
        else setLocError("Konum alınamadı: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendPhoto = async (file) => {
    if (!file) return;
    setLocError("");
    if (!file.type.startsWith("image/")) { setLocError("Sadece görsel dosyası yükleyebilirsin."); return; }
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImageFile(file, 900, 0.7);
      await sendMessageApi(trip.id, { kind: "photo", photo: dataUrl });
    } catch (e) {
      setLocError(e.message || "Fotoğraf gönderilemedi.");
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 220px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <MessageCircle size={18} color={T.amber} />
        <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 18, fontWeight: 800 }}>{L.chatTitle}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, boxShadow: T.shadowSoft, marginBottom: 10 }}>
        {error && <Empty text={error} />}
        {!error && messages === null && <Spinner label="Yükleniyor..." />}
        {!error && messages?.length === 0 && <Empty text={L.chatEmpty} />}
        {messages?.map(m => {
          const mine = m.senderMemberId === myMemberId;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
              {!mine && <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 2, marginLeft: 4 }}>{m.senderName}</div>}
              {m.kind === "location" ? (
                <a href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
                  background: mine ? T.amberDim : T.cardAlt, border: `1px solid ${mine ? "rgba(107,142,78,0.4)" : T.border}`,
                  borderRadius: 14, padding: "10px 14px", maxWidth: "78%",
                }}>
                  <MapPin size={16} color={T.amber} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{m.live ? "Canlı konum" : "Konum paylaşıldı"}</div>
                    <div style={{ fontSize: 10.5, color: T.teal }}>Haritada göster →</div>
                  </div>
                </a>
              ) : m.kind === "photo" ? (
                <img src={m.photo} onClick={() => setLightbox(m.photo)} alt="Paylaşılan fotoğraf" style={{
                  maxWidth: "70%", borderRadius: 14, cursor: "zoom-in", display: "block",
                  border: `1px solid ${T.border}`, boxShadow: T.shadowSoft,
                }} />
              ) : (
                <div style={{
                  background: mine ? T.amber : T.cardAlt, color: mine ? (T.buttonTextOnAccent || "#fff") : T.text,
                  borderRadius: 14, padding: "9px 14px", maxWidth: "78%", fontSize: 13.5, lineHeight: 1.4, wordBreak: "break-word",
                }}>
                  {m.text}
                </div>
              )}
              <div style={{ fontSize: 9.5, color: T.muted, marginTop: 2 }}>{fmtTime(new Date(m.createdAt))}</div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {locError && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.dangerDim, borderRadius: 10, padding: "7px 10px", marginBottom: 8, fontSize: 11.5 }}>
          <AlertTriangle size={12} color={T.danger} /> {locError}
        </div>
      )}

      {liveOn && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.tealDim, borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.teal, animation: "fadeIn 1s ease infinite alternate", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: T.text, flex: 1 }}>Canlı konum paylaşılıyor (15 dk sonra kendiliğinden duracak)</span>
          <button onClick={stopLiveLocation} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700 }}>
            <X size={12} /> Durdur
          </button>
        </div>
      )}

      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => sendPhoto(e.target.files?.[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => sendPhoto(e.target.files?.[0])} />

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={shareLocation} disabled={locating} title="Konumumu paylaş" style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card,
          color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          {locating ? <Spinner label="" /> : <MapPin size={17} />}
        </button>
        <button onClick={liveOn ? stopLiveLocation : startLiveLocation} title={liveOn ? "Canlı konumu durdur" : "Canlı konum paylaş (15 dk)"} style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: `1px solid ${liveOn ? T.teal : T.border}`,
          background: liveOn ? T.tealDim : T.card, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Navigation size={17} />
        </button>
        <button onClick={() => galleryInputRef.current?.click()} disabled={photoBusy} title="Galeriden fotoğraf" style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card,
          color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          {photoBusy ? <Spinner label="" /> : <ImageIcon size={17} />}
        </button>
        <button onClick={() => cameraInputRef.current?.click()} disabled={photoBusy} title="Fotoğraf çek" style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card,
          color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Camera size={17} />
        </button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder={L.chatPlaceholder}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          style={{ flex: 1, minWidth: 0, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0 12px", color: T.text, fontSize: 16 }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{
          flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: "none", background: T.amber,
          color: T.buttonTextOnAccent || "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}><Send size={17} /></button>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
        }}>
          <img src={lightbox} alt="Büyük" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
