import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle, Vote, CalendarClock, Backpack, CheckCircle2, X,
  Wallet, Cloud, TrendingUp, ShieldAlert, Users, Compass, Film, Map as MapIcon,
} from "lucide-react";
import { T } from "../lib/theme.js";
import { Avatar } from "./primitives.jsx";
import { POI_CATEGORIES } from "../lib/poiCategories.js";
import { fmtMoney, weatherEmoji, computeBalances } from "../lib/utils.js";
import { getPollsApi, getItineraryApi, getPackingApi } from "../lib/api.js";

// A single "for you" row that can be swiped left to dismiss for this
// session (it isn't deleted anywhere — it's just hidden from view here,
// the same way clearing a phone notification doesn't undo whatever it was
// telling you about).
function TodoRow({ icon: Icon, color, title, body, onClick, onDismiss }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const rowRef = useRef(null);

  const onPointerDown = (e) => {
    startXRef.current = e.clientX;
    setDragging(true);
    rowRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    setDragX(Math.min(0, delta)); // only allow dragging left
  };
  const endDrag = () => {
    setDragging(false);
    if (dragX < -90) {
      setDragX(-400); // finish the swipe off-screen
      setTimeout(onDismiss, 180);
    } else {
      setDragX(0); // snap back
    }
  };

  return (
    <div style={{ position: "relative", marginBottom: 9, overflow: "hidden", borderRadius: 14 }}>
      <div style={{
        position: "absolute", inset: 0, background: T.dangerDim, display: "flex", alignItems: "center",
        justifyContent: "flex-end", paddingRight: 16, color: T.danger,
      }}><X size={16} /></div>
      <button
        ref={rowRef}
        onClick={() => { if (Math.abs(dragX) < 5) onClick?.(); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "13px 14px", boxShadow: T.shadowSoft, cursor: "pointer", textAlign: "left",
          transform: `translateX(${dragX}px)`, transition: dragging ? "none" : "transform 0.22s ease", touchAction: "pan-y",
          position: "relative",
        }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "1f", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          <Icon size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{title}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{body}</div>
        </div>
      </button>
    </div>
  );
}

function QuickCard({ icon: Icon, label, value, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14,
      boxShadow: T.shadowSoft, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: accent + "1f", display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
      </div>
    </button>
  );
}

export default function HomeTab({ trip, fx, weather, myMemberId, setView }) {
  const [openPoll, setOpenPoll] = useState(null);
  const [nextItem, setNextItem] = useState(null);
  const [myPackingLeft, setMyPackingLeft] = useState(0);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    getPollsApi(trip.id).then(r => {
      const mine = (r.polls || []).find(p => !p.closed && !p.votes.some(v => v.memberId === myMemberId));
      setOpenPoll(mine || null);
    }).catch(() => {});
    getItineraryApi(trip.id).then(r => {
      setNextItem((r.items || [])[0] || null);
    }).catch(() => {});
    getPackingApi(trip.id).then(r => {
      const mine = (r.items || []).filter(i => i.assignedTo === myMemberId && !i.done);
      setMyPackingLeft(mine.length);
    }).catch(() => {});
  }, [trip.id, myMemberId]);

  const myBalance = myMemberId ? computeBalances(trip)[myMemberId] || 0 : 0;
  const currency = trip.currencyCode || "TRY";
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);

  const allItems = [];
  if (myBalance < -0.5) allItems.push({ key: "debt", icon: AlertCircle, color: T.danger, title: `${fmtMoney(-myBalance, currency)} borcun var`, body: "Bakiye özetinden öde", onClick: () => setView("budget") });
  if (myBalance > 0.5) allItems.push({ key: "credit", icon: AlertCircle, color: T.success, title: `${fmtMoney(myBalance, currency)} alacağın var`, body: "Hatırlatma gönderebilirsin", onClick: () => setView("budget") });
  if (openPoll) allItems.push({ key: "poll", icon: Vote, color: T.amber, title: "Bir oylama seni bekliyor", body: openPoll.question, onClick: () => setView("polls") });
  if (nextItem) allItems.push({ key: "itinerary", icon: CalendarClock, color: T.navy, title: `Sıradaki plan${nextItem.time ? " · " + nextItem.time.slice(0, 5) : ""}`, body: nextItem.title, onClick: () => setView("itinerary") });
  if (myPackingLeft > 0) allItems.push({ key: "packing", icon: Backpack, color: T.teal, title: `${myPackingLeft} paket maddesi kaldı`, body: "Paket listesini gör", onClick: () => setView("packing") });
  const items = allItems.filter(it => !dismissed.has(it.key));

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${T.navy}, ${T.amber})`, borderRadius: 20, padding: 20,
        boxShadow: T.shadow, marginBottom: 16,
      }}>
        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 23, fontWeight: 700, color: T.buttonTextOnAccent }}>{trip.name}</div>
        <div style={{ fontSize: 12.5, color: T.buttonTextOnAccent, opacity: 0.85, marginTop: 3 }}>{trip.city}, {trip.country}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
          {trip.members.slice(0, 6).map((m, i) => (
            <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${T.amber}`, borderRadius: "50%" }}><Avatar member={m} size={27} /></div>
          ))}
          <span style={{ fontSize: 11, color: T.buttonTextOnAccent, opacity: 0.85, marginLeft: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={12} /> {trip.members.length} kişi
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <QuickCard icon={Wallet} label="Toplam Harcama" value={fmtMoney(total, currency)} onClick={() => setView("budget")} accent={T.amber} />
        <QuickCard icon={Cloud} label="Şu An" value={weather?.temp !== undefined ? `${Math.round(weather.temp)}° ${weatherEmoji(weather.code)}` : "—"} onClick={() => setView("weather")} accent={T.teal} />
        <QuickCard icon={TrendingUp} label="Kur" value={fx ? `1 ${fx.code} = ${fx.rate.toFixed(2)}` : "—"} onClick={() => setView("currency")} accent={T.navy} />
        <QuickCard icon={ShieldAlert} label="Güvenlik" value={`${trip.hazards?.length || 0} not`} onClick={() => setView("security")} accent={T.danger} />
      </div>

      {items.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Senin İçin</div>
          {items.map(it => (
            <TodoRow key={it.key} {...it} onDismiss={() => setDismissed(d => new Set([...d, it.key]))} />
          ))}
          <div style={{ height: 8 }} />
        </>
      )}

      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Keşfetmeye Başla</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 18 }}>
        {POI_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setView(`category:${c.key}`)} style={{
            flexShrink: 0, width: 82, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 8px", cursor: "pointer", boxShadow: T.shadowSoft,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber }}>
              <c.icon size={16} />
            </div>
            <span style={{ fontSize: 10, color: T.text, textAlign: "center", lineHeight: 1.2 }}>{c.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => setView("vlog")} style={{
          background: `linear-gradient(135deg, ${T.amber}, ${T.navy})`, border: "none", borderRadius: 16, padding: 16,
          color: T.buttonTextOnAccent, cursor: "pointer", textAlign: "left", boxShadow: T.shadowSoft,
        }}>
          <Film size={19} />
          <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8 }}>Seyahat Vlogu</div>
          <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>Günlük tarzı bir anlatı oku</div>
        </button>
        <button onClick={() => setView("map")} style={{
          background: `linear-gradient(135deg, ${T.teal}, ${T.navy})`, border: "none", borderRadius: 16, padding: 16,
          color: T.buttonTextOnAccent, cursor: "pointer", textAlign: "left", boxShadow: T.shadowSoft,
        }}>
          <MapIcon size={19} />
          <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8 }}>Harita</div>
          <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>Konumu haritada gör</div>
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.successDim, borderRadius: 14, padding: 16, marginTop: 18 }}>
          <CheckCircle2 size={18} color={T.success} />
          <span style={{ fontSize: 12.5, color: T.text }}>Her şey yolunda, bekleyen bir işin yok.</span>
        </div>
      )}
    </div>
  );
}
