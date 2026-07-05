import React from "react";
import { MessageCircle, MapPin, Receipt, HandCoins, UserPlus, X } from "lucide-react";
import { T } from "../lib/theme.js";

const ICONS = {
  chat_message: MessageCircle,
  location_shared: MapPin,
  expense_added: Receipt,
  payment_made: HandCoins,
  member_joined: UserPlus,
};

export function NotificationToasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", top: "calc(10px + env(safe-area-inset-top))", left: 12, right: 12, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 8, maxWidth: 406, margin: "0 auto", pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const Icon = ICONS[t.type] || MessageCircle;
        return (
          <div key={t.id} onClick={() => onDismiss(t.id)} style={{
            pointerEvents: "auto", display: "flex", alignItems: "flex-start", gap: 10,
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", cursor: "pointer", animation: "fadeIn 0.25s ease",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: T.amberDim, color: T.amber, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Icon size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{t.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.body}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
