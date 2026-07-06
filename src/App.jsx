import React, { useEffect, useReducer, useState } from "react";
import { T, FONTS, applyTheme, onThemeChange } from "./lib/theme.js";
import { setLanguage, onLanguageChange } from "./lib/i18n.js";
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

// A tapped push notification lands here as /?tripId=...&view=chat — this
// reads that once, then cleans the URL so a later refresh doesn't keep
// forcing the same screen.
function readDeepLinkFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get("tripId");
    const view = params.get("view");
    if (tripId) {
      window.history.replaceState({}, "", window.location.pathname);
      return { tripId, view: view || "home" };
    }
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const [authed, setAuthed] = useState(!!getAuth()?.token);
  const [deepLink] = useState(() => readDeepLinkFromUrl()); // read once — it clears the URL as a side effect
  const [activeTripId, setActiveTripId] = useState(() => deepLink?.tripId || null);
  const [initialTripView, setInitialTripView] = useState(() => deepLink?.view || null);
  const [pendingInvite, setPendingInvite] = useState(() => readInviteFromUrl());
  const [resetToken] = useState(() => readResetTokenFromUrl());
  const [sessionMsg, setSessionMsg] = useState("");
  const [, forceThemeRerender] = useReducer(x => x + 1, 0);

  // Runs once, synchronously, before first paint — applies the saved theme
  // (or system preference on first-ever visit) so there's no flash of the
  // wrong theme.
  useState(() => {
    try {
      const saved = localStorage.getItem("pusula_theme_mode");
      const mode = saved || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      applyTheme(mode);
      const savedLang = localStorage.getItem("pusula_lang");
      if (savedLang) setLanguage(savedLang);
    } catch { /* ignore */ }
  });

  useEffect(() => {
    onUnauthorized(() => {
      setSessionMsg("Oturumun sona ermiş görünüyor, adını tekrar girmen yeterli.");
      setAuthed(false);
      setActiveTripId(null);
    });
    const offTheme = onThemeChange(forceThemeRerender);
    const offLang = onLanguageChange(forceThemeRerender);
    return () => { offTheme(); offLang(); };
  }, []);

  const handleReady = () => { setSessionMsg(""); setAuthed(true); };
  const handleLogout = () => { clearAuth(); setActiveTripId(null); setAuthed(false); };

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg, color: T.text, fontFamily: "'Nunito',sans-serif",
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
        <TripDetail tripId={activeTripId} initialView={initialTripView} onConsumeInitialView={() => setInitialTripView(null)} onBack={() => setActiveTripId(null)} onLogout={handleLogout} />
      ) : (
        <TripList onOpen={setActiveTripId} pendingInvite={pendingInvite} onConsumeInvite={() => setPendingInvite(null)} onLogout={handleLogout} />
      )}
    </div>
  );
}
