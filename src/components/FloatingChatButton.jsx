import React from "react";
import { MessageCircle } from "lucide-react";
import { T } from "../lib/theme.js";

export default function FloatingChatButton({ onClick, active, unread = 0 }) {
  if (active) return null; // don't show it while already on the chat screen
  return (
    <button onClick={onClick} style={{
      position: "fixed", left: 14, bottom: "calc(78px + env(safe-area-inset-bottom))", zIndex: 40,
      width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
      background: T.amber, color: T.buttonTextOnAccent || "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    }}>
      <MessageCircle size={22} />
      {unread > 0 && (
        <div style={{
          position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9,
          background: T.danger, color: "#fff", fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
        }}>{unread > 9 ? "9+" : unread}</div>
      )}
    </button>
  );
}
