import React, { useEffect, useRef, useState } from "react";
import { Send, MapPin, MessageCircle, AlertTriangle } from "lucide-react";
import { T } from "../lib/theme.js";
import { Spinner, Empty } from "./primitives.jsx";
import { getMessagesApi, sendMessageApi, getAuth } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";
import { fmtTime } from "../lib/utils.js";

export default function ChatTab({ trip, myMemberId }) {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const scrollRef = useRef(null);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 220px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <MessageCircle size={18} color={T.amber} />
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 800 }}>Seyahat Sohbeti</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 12, boxShadow: T.shadowSoft, marginBottom: 10 }}>
        {error && <Empty text={error} />}
        {!error && messages === null && <Spinner label="Yükleniyor..." />}
        {!error && messages?.length === 0 && <Empty text="Henüz mesaj yok — ilk mesajı sen yaz." />}
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
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Konum paylaşıldı</div>
                    <div style={{ fontSize: 10.5, color: T.teal }}>Haritada göster →</div>
                  </div>
                </a>
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

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={shareLocation} disabled={locating} title="Konumumu paylaş" style={{
          flexShrink: 0, width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card,
          color: T.teal, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          {locating ? <Spinner label="" /> : <MapPin size={18} />}
        </button>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Mesaj yaz..."
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0 14px", color: T.text, fontSize: 16 }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{
          flexShrink: 0, width: 42, height: 42, borderRadius: 12, border: "none", background: T.amber,
          color: T.buttonTextOnAccent || "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}><Send size={17} /></button>
      </div>
    </div>
  );
}
