import React from "react";
import {
  X, Home, Wallet, Compass, Cloud, TrendingUp, ShieldAlert, Film, Map as MapIcon,
  User, Images, MessageCircle, ChevronLeft, LogOut,
} from "lucide-react";
import { T } from "../lib/theme.js";
import { L } from "../lib/i18n.js";

export default function Sidebar({ open, onClose, view, setView, tripName, onBackToList, onLogout }) {
  // Built at render time (not module load time) so labels reflect the
  // current language whenever the user switches it.
  const ITEMS = [
    { key: "home", label: L.navHome, icon: Home },
    { key: "budget", label: L.navBudget, icon: Wallet },
    { key: "explore", label: L.navExplore, icon: Compass },
    { key: "weather", label: L.navWeather, icon: Cloud },
    { key: "currency", label: L.navCurrency, icon: TrendingUp },
    { key: "security", label: L.navSecurity, icon: ShieldAlert },
    { key: "chat", label: L.navChat, icon: MessageCircle },
    { key: "vlog", label: L.navVlog, icon: Film },
    { key: "map", label: L.navMap, icon: MapIcon },
    { key: "photos", label: L.navPhotos, icon: Images },
    { key: "profile", label: L.navProfile, icon: User },
  ];
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(20,10,5,0.45)", zIndex: 40,
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.2s ease",
      }} />
      <div style={{
        position: "fixed", top: 0, bottom: 0, left: 0, width: "78%", maxWidth: 300, zIndex: 50,
        background: T.card, boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top)",
      }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 17, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tripName}</div>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.muted, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {ITEMS.map(item => (
            <button key={item.key} onClick={() => { setView(item.key); onClose(); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2,
              background: view === item.key ? T.amberDim : "transparent",
              color: view === item.key ? T.amber : T.text, fontSize: 14.5, fontWeight: view === item.key ? 600 : 500,
              textAlign: "left",
            }}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 10, borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => { onBackToList(); onClose(); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
            borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: T.muted, fontSize: 13.5,
          }}>
            <ChevronLeft size={17} /> {L.backToTrips}
          </button>
          <button onClick={onLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
            borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: T.danger, fontSize: 13.5,
          }}>
            <LogOut size={17} /> {L.logout}
          </button>
        </div>
      </div>
    </>
  );
}
