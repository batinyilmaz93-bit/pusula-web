import React, { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { T } from "../lib/theme.js";
import { Avatar } from "./primitives.jsx";
import { spinGameApi } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";
import { colorForId } from "../lib/utils.js";

const SPIN_DURATION_MS = 3800;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function sliceArcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// Nothing here gets stored anywhere (no history endpoint, no DB table) — a
// spin is a live, in-the-moment result only, by design.
export default function GameTab({ trip }) {
  const [selected, setSelected] = useState(() => trip.members.map(m => m.id));
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState("");
  const wheelOrderRef = useRef(trip.members.map(m => m.id));
  const knownMemberIdsRef = useRef(new Set(trip.members.map(m => m.id)));
  const lastResultIdRef = useRef(null);

  // If someone joins the trip while this screen is already open, include
  // them by default instead of silently leaving the wheel stuck on a
  // stale, possibly-too-small participant list.
  useEffect(() => {
    const newIds = trip.members.map(m => m.id).filter(id => !knownMemberIdsRef.current.has(id));
    if (newIds.length) {
      setSelected(s => [...s, ...newIds]);
      newIds.forEach(id => knownMemberIdsRef.current.add(id));
    }
  }, [trip.members]);

  useEffect(() => {
    const socket = getSocket();
    const onGame = (result) => {
      if (result.tripId !== trip.id) return;
      if (result.id === lastResultIdRef.current) return; // this is our own spin echoing back — already animated it below
      lastResultIdRef.current = result.id;
      wheelOrderRef.current = result.participantIds;
      landOn(result.winnerId, result.participantIds);
    };
    socket.on("trip:game", onGame);
    return () => socket.off("trip:game", onGame);
  }, [trip.id]); // eslint-disable-line

  const memberById = Object.fromEntries(trip.members.map(m => [m.id, m]));
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const landOn = (winnerId, participantIds) => {
    const n = participantIds.length;
    const seg = 360 / n;
    const idx = participantIds.indexOf(winnerId);
    const midpoint = idx * seg + seg / 2;
    const spins = 5;
    setSpinning(true);
    setWinner(null);
    setRotation(r => {
      // Always spin forward from the current visual position, never backward.
      const base = Math.ceil(r / 360) * 360;
      return base + spins * 360 + (360 - midpoint);
    });
    setTimeout(() => {
      setSpinning(false);
      setWinner(memberById[winnerId] || { id: winnerId, name: "?" });
    }, SPIN_DURATION_MS);
  };

  const spin = async () => {
    if (selected.length < 2) { setError("En az 2 kişi seçilmeli."); return; }
    setError("");
    try {
      wheelOrderRef.current = selected;
      const result = await spinGameApi(trip.id, selected);
      // Animate immediately from our own response instead of waiting on the
      // socket round-trip — the person who tapped the button shouldn't have
      // to wait on network jitter to see anything happen. Other viewers
      // still get the same animation via the trip:game broadcast.
      lastResultIdRef.current = result.id;
      landOn(result.winnerId, result.participantIds);
    } catch (e) {
      setError(e.message);
    }
  };

  // Before any spin has happened yet, show the wheel matching the live
  // selection so it doesn't look stuck on a stale member count; once a spin
  // starts (or has a result), freeze to the exact set that was actually spun.
  const wheelIds = (spinning || winner) ? wheelOrderRef.current : selected;
  const n = wheelIds.length;
  const seg = n ? 360 / n : 360;
  const R = 130, CX = 140, CY = 140;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Dices size={18} color={T.amber} />
        <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 18, fontWeight: 800 }}>Ödeme Oyunu</div>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        Çarkı çevir, kim ısmarlayacak rastgele belirlensin — herkes aynı sonucu aynı anda görür.
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, position: "relative" }}>
        <div style={{
          position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", zIndex: 2,
          width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
          borderTop: `16px solid ${T.danger}`,
        }} />
        <svg width={280} height={280} viewBox="0 0 280 280" style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.72, 0.15, 1)` : "none",
          willChange: "transform",
        }}>
          {wheelIds.map((id, i) => {
            const m = memberById[id];
            const start = i * seg, end = (i + 1) * seg;
            const mid = start + seg / 2;
            const labelPos = polarToCartesian(CX, CY, R * 0.62, mid);
            return (
              <g key={id}>
                <path d={sliceArcPath(CX, CY, R, start, end)} fill={colorForId(id)} stroke={T.card} strokeWidth={2} />
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={n > 6 ? 10 : 12} fontWeight={700} fill="#2A1C10" style={{ fontFamily: "'Libre Baskerville',sans-serif" }}>
                  {(m?.name || "?").slice(0, 8)}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={20} fill={T.card} stroke={T.border} strokeWidth={2} />
        </svg>
      </div>

      {winner && !spinning && (
        <div style={{
          textAlign: "center", background: T.amberDim, border: `1.5px solid ${T.amber}`, borderRadius: 14,
          padding: "14px", marginBottom: 16, animation: "fadeIn 0.3s ease",
        }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>🎉 Bu sefer ısmarlayan:</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Avatar member={winner} size={30} />
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{winner.name}</span>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>Kim çarkta olsun?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {trip.members.map(m => (
          <button key={m.id} onClick={() => toggle(m.id)} disabled={spinning} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 20,
            border: `1.5px solid ${selected.includes(m.id) ? T.amber : T.border}`,
            background: selected.includes(m.id) ? T.amberDim : "transparent", cursor: spinning ? "default" : "pointer",
          }}>
            <Avatar member={m} size={18} /> <span style={{ fontSize: 12 }}>{m.name}</span>
          </button>
        ))}
      </div>
      {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>}

      <button onClick={spin} disabled={spinning || selected.length < 2} style={{
        width: "100%", padding: "13px", borderRadius: 14, border: "none", background: T.amber, color: T.buttonTextOnAccent || "#fff",
        fontWeight: 800, fontSize: 15, cursor: spinning ? "default" : "pointer", opacity: spinning ? 0.7 : 1,
      }}>{spinning ? "Dönüyor..." : "Çarkı Çevir 🎲"}</button>
    </div>
  );
}
