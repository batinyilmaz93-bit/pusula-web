import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Vote, CalendarClock, Backpack, CheckCircle2, X } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmtMoney, computeBalances } from "../lib/utils.js";
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

  const allItems = [];
  if (myBalance < -0.5) allItems.push({ key: "debt", icon: AlertCircle, color: T.danger, title: `${fmtMoney(-myBalance, currency)} borcun var`, body: "Bakiye özetinden öde", onClick: () => setView("budget") });
  if (myBalance > 0.5) allItems.push({ key: "credit", icon: AlertCircle, color: T.success, title: `${fmtMoney(myBalance, currency)} alacağın var`, body: "Hatırlatma gönderebilirsin", onClick: () => setView("budget") });
  if (openPoll) allItems.push({ key: "poll", icon: Vote, color: T.amber, title: "Bir oylama seni bekliyor", body: openPoll.question, onClick: () => setView("polls") });
  if (nextItem) allItems.push({ key: "itinerary", icon: CalendarClock, color: T.navy, title: `Sıradaki plan${nextItem.time ? " · " + nextItem.time.slice(0, 5) : ""}`, body: nextItem.title, onClick: () => setView("itinerary") });
  if (myPackingLeft > 0) allItems.push({ key: "packing", icon: Backpack, color: T.teal, title: `${myPackingLeft} paket maddesi kaldı`, body: "Paket listesini gör", onClick: () => setView("packing") });

  const items = allItems.filter(it => !dismissed.has(it.key));

  return (
    <div>
      <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 21, fontWeight: 700, marginBottom: 2 }}>{trip.name}</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{trip.city}, {trip.country}</div>

      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Senin İçin</div>
      {items.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.successDim, borderRadius: 14, padding: 16 }}>
          <CheckCircle2 size={20} color={T.success} />
          <span style={{ fontSize: 13, color: T.text }}>Her şey yolunda, bekleyen bir işin yok.</span>
        </div>
      ) : items.map(it => (
        <TodoRow key={it.key} {...it} onDismiss={() => setDismissed(d => new Set([...d, it.key]))} />
      ))}
    </div>
  );
}
