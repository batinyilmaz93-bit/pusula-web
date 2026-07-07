import React, { useEffect, useRef, useState } from "react";
import { Compass as CompassIcon } from "lucide-react";
import { T } from "../lib/theme.js";

// Reads the device's real orientation sensor to point a needle at North.
// iOS requires an explicit user-gesture permission request; most
// Android/desktop browsers just start delivering events once listened for.
export default function CompassWidget({ size = 130 }) {
  const [heading, setHeading] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [denied, setDenied] = useState(false);
  const [supported, setSupported] = useState(true);
  const listeningRef = useRef(false);

  const handleOrientation = (e) => {
    let h = null;
    if (typeof e.webkitCompassHeading === "number") {
      h = e.webkitCompassHeading;
    } else if (e.alpha != null) {
      h = 360 - e.alpha;
    }
    if (h != null && !Number.isNaN(h)) setHeading(h);
  };

  const startListening = () => {
    if (listeningRef.current) return;
    listeningRef.current = true;
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSupported(false);
      return;
    }
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      setNeedsPermission(true);
    } else {
      startListening();
    }
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === "granted") {
        setNeedsPermission(false);
        startListening();
      } else {
        setDenied(true);
      }
    } catch {
      setDenied(true);
    }
  };

  if (!supported) {
    return (
      <div style={{ textAlign: "center", padding: 16, color: T.muted, fontSize: 12 }}>
        Bu cihaz/tarayıcı pusula sensörünü desteklemiyor.
      </div>
    );
  }

  const cx = 100, cy = 100, r = 92;
  // 16-point compass-rose star, alternating long/short spokes — the classic
  // ornate-compass look, drawn in SVG so it scales crisply at any size.
  const spokes = [];
  for (let i = 0; i < 16; i++) {
    const angle = i * 22.5;
    const isCardinal = i % 4 === 0;
    const isDiagonal = i % 2 === 0 && !isCardinal;
    const len = isCardinal ? r * 0.88 : isDiagonal ? r * 0.62 : r * 0.4;
    const rad = (angle - 90) * (Math.PI / 180);
    const x = cx + len * Math.cos(rad);
    const y = cy + len * Math.sin(rad);
    spokes.push({ x, y, isCardinal });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" }}>
      <div style={{
        width: size + 20, height: size + 20, borderRadius: "50%",
        background: `linear-gradient(150deg, #D4A94F, ${T.amber}, ${T.navy})`, padding: 7,
        boxShadow: T.shadow, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden",
          border: `2.5px solid #D4A94F`, boxShadow: "inset 0 0 14px rgba(0,0,0,0.18)",
        }}>
          {/* Aged-paper face with a faint map texture, echoing the antique
              cartography look of the reference — reuses the same background
              image already bundled for the app, not a new external asset. */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(${T.card}dd, ${T.card}ee), url('/images/travel-desk-bg.jpg')`,
            backgroundSize: "260% auto", backgroundPosition: "38% 55%",
          }} />

          <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ position: "relative" }}>
            {spokes.map((s, i) => (
              <line key={i} x1={cx} y1={cy} x2={s.x} y2={s.y}
                stroke={s.isCardinal ? T.amber : T.dash} strokeWidth={s.isCardinal ? 1.6 : 0.8} opacity={s.isCardinal ? 0.85 : 0.5} />
            ))}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={1.5} />
            <circle cx={cx} cy={cy} r={r * 0.68} fill="none" stroke={T.border} strokeWidth={1} opacity={0.6} />

            {[{ l: "K", a: 0 }, { l: "D", a: 90 }, { l: "G", a: 180 }, { l: "B", a: 270 }].map(({ l, a }) => {
              const rad = (a - 90) * (Math.PI / 180);
              const x = cx + r * 0.79 * Math.cos(rad);
              const y = cy + r * 0.79 * Math.sin(rad);
              return (
                <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={l === "K" ? 15 : 13} fontWeight={800} fill={T.text} fontFamily="'Libre Baskerville',serif">{l}</text>
              );
            })}

            <g style={{ transform: `rotate(${heading != null ? -heading : 0}deg)`, transformOrigin: "100px 100px", transition: "transform 0.25s ease-out" }}>
              <polygon points={`${cx},${cy - r * 0.7} ${cx - 7},${cy} ${cx + 7},${cy}`} fill={T.danger} />
              <polygon points={`${cx},${cy + r * 0.52} ${cx - 7},${cy} ${cx + 7},${cy}`} fill={T.muted} />
            </g>
            <circle cx={cx} cy={cy} r={6} fill="#D4A94F" stroke={T.text} strokeWidth={1.5} />
          </svg>
        </div>
      </div>

      {needsPermission && (
        <button onClick={requestPermission} style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 6, background: T.amberDim, border: "none",
          borderRadius: 20, padding: "7px 14px", color: T.amber, fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}><CompassIcon size={13} /> Pusulayı Etkinleştir</button>
      )}
      {denied && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted, textAlign: "center", maxWidth: 220 }}>
          Konum yönü izni verilmedi — telefon ayarlarından bu site için hareket sensörü iznini açman gerekiyor.
        </div>
      )}
      {!needsPermission && !denied && heading == null && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>Yön algılanıyor...</div>
      )}
    </div>
  );
}
