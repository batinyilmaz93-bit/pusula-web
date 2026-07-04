import React, { useEffect, useState } from "react";
import { T, FONTS } from "./lib/theme.js";
import { getAuth, clearAuth, onUnauthorized } from "./lib/api.js";
import Login from "./components/Login.jsx";
import TripList from "./components/TripList.jsx";
import TripDetail from "./components/TripDetail.jsx";

function readInviteFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (code) {
      // Clean the URL so a refresh doesn't re-trigger the join screen.
      window.history.replaceState({}, "", window.location.pathname);
      return code.toUpperCase();
    }
  } catch { /* ignore */ }
  return null;
}

function readResetTokenFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      window.history.replaceState({}, "", window.location.pathname);
      return token;
    }
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const [authed, setAuthed] = useState(!!getAuth()?.token);
  const [activeTripId, setActiveTripId] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(() => readInviteFromUrl());
  const [resetToken] = useState(() => readResetTokenFromUrl());
  const [sessionMsg, setSessionMsg] = useState("");

  useEffect(() => {
    onUnauthorized(() => {
      setSessionMsg("Oturumun sona ermiş görünüyor, adını tekrar girmen yeterli.");
      setAuthed(false);
      setActiveTripId(null);
    });
  }, []);

  const handleReady = () => { setSessionMsg(""); setAuthed(true); };
  const handleLogout = () => { clearAuth(); setActiveTripId(null); setAuthed(false); };

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif",
      maxWidth: 430, margin: "0 auto", position: "relative",
    }}>
      <style>{FONTS}{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        html, body { overscroll-behavior-y: none; }
        input:focus { outline: 1.5px solid ${T.teal}; }
        button { font-family: inherit; transition: transform 0.08s ease, opacity 0.08s ease; }
        button:active { transform: scale(0.96); opacity: 0.9; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        a:hover { border-color: ${T.teal} !important; }
        @media (max-width: 370px) {
          .invite-code-text { display: none; }
        }
      `}</style>

      {!authed ? (
        <Login onReady={handleReady} message={sessionMsg} initialResetToken={resetToken} />
      ) : activeTripId ? (
        <TripDetail tripId={activeTripId} onBack={() => setActiveTripId(null)} onLogout={handleLogout} />
      ) : (
        <TripList onOpen={setActiveTripId} pendingInvite={pendingInvite} onConsumeInvite={() => setPendingInvite(null)} onLogout={handleLogout} />
      )}
    </div>
  );
}
