import React, { useState } from "react";
import { T, FONTS } from "./lib/theme.js";
import { getAuth } from "./lib/api.js";
import NameGate from "./components/NameGate.jsx";
import TripList from "./components/TripList.jsx";
import TripDetail from "./components/TripDetail.jsx";

export default function App() {
  const [authed, setAuthed] = useState(!!getAuth()?.token);
  const [activeTripId, setActiveTripId] = useState(null);

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg, color: T.text, fontFamily: "'Inter',sans-serif",
      maxWidth: 430, margin: "0 auto", position: "relative",
    }}>
      <style>{FONTS}{`
        * { box-sizing: border-box; }
        input:focus { outline: 1.5px solid ${T.teal}; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        a:hover { border-color: ${T.teal} !important; }
      `}</style>

      {!authed ? (
        <NameGate onReady={() => setAuthed(true)} />
      ) : activeTripId ? (
        <TripDetail tripId={activeTripId} onBack={() => setActiveTripId(null)} />
      ) : (
        <TripList onOpen={setActiveTripId} />
      )}
    </div>
  );
}
