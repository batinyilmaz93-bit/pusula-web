import React, { useEffect, useState } from "react";
import { Vote, Plus, Trash2, X, Check } from "lucide-react";
import { T } from "../lib/theme.js";
import { Empty, Spinner } from "./primitives.jsx";
import { getPollsApi, addPollApi, voteOnPollApi, deletePollApi } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";

export default function PollsTab({ trip, myMemberId, isAdmin }) {
  const [polls, setPolls] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);

  const refresh = () => getPollsApi(trip.id).then(r => setPolls(r.polls)).catch(e => setError(e.message));

  useEffect(() => { refresh(); }, [trip.id]); // eslint-disable-line

  useEffect(() => {
    const socket = getSocket();
    const onPolls = (payload) => { if (payload.tripId === trip.id) refresh(); };
    socket.on("trip:polls", onPolls);
    return () => socket.off("trip:polls", onPolls);
  }, [trip.id]); // eslint-disable-line

  const addOption = () => setOptions(o => [...o, ""]);
  const updateOption = (i, val) => setOptions(o => o.map((x, idx) => idx === i ? val : x));
  const removeOption = (i) => setOptions(o => o.filter((_, idx) => idx !== i));

  const submitPoll = async () => {
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) { setError("Bir soru ve en az 2 seçenek gir."); return; }
    setBusy(true);
    try {
      await addPollApi(trip.id, question.trim(), cleanOptions);
      setQuestion(""); setOptions(["", ""]); setShowAdd(false); setError("");
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const vote = async (pollId, optionIndex) => {
    try { await voteOnPollApi(trip.id, pollId, optionIndex); refresh(); } catch (e) { setError(e.message); }
  };

  const removePoll = async (pollId) => {
    try { await deletePollApi(trip.id, pollId); refresh(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Vote size={18} color={T.amber} />
          <div style={{ fontFamily: "'Libre Baskerville',sans-serif", fontSize: 18, fontWeight: 800 }}>Oylamalar</div>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 5, background: T.amberDim, border: "none", borderRadius: 20,
          padding: "7px 12px", color: T.amber, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}><Plus size={13} /> Oylama Aç</button>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        Tarih, gidilecek yer, aktivite gibi kararları grup olarak oylayın.
      </div>

      {showAdd && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: T.shadowSoft }}>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Örn. Hangi gün gidelim?"
            style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
          {options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Seçenek ${i + 1}`}
                style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", color: T.text, fontSize: 14, boxSizing: "border-box" }} />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={16} /></button>
              )}
            </div>
          ))}
          <button onClick={addOption} style={{ background: "none", border: "none", color: T.teal, fontSize: 12.5, cursor: "pointer", marginBottom: 10, padding: 0 }}>+ Seçenek ekle</button>
          {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <button onClick={submitPoll} disabled={busy} style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none", background: T.amber, color: T.buttonTextOnAccent || "#fff",
            fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}>{busy ? "Oluşturuluyor..." : "Oylamayı Başlat"}</button>
        </div>
      )}

      {polls === null && <Spinner label="Yükleniyor..." />}
      {polls?.length === 0 && <Empty text="Henüz oylama yok." />}
      {polls?.map(poll => {
        const totalVotes = poll.votes.length;
        const myVote = poll.votes.find(v => v.memberId === myMemberId);
        return (
          <div key={poll.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: T.shadowSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{poll.question}</div>
              {isAdmin && (
                <button onClick={() => removePoll(poll.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", flexShrink: 0 }}><Trash2 size={14} /></button>
              )}
            </div>
            {poll.options.map((opt, i) => {
              const count = poll.votes.filter(v => v.optionIndex === i).length;
              const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
              const mine = myVote?.optionIndex === i;
              return (
                <button key={i} onClick={() => vote(poll.id, i)} style={{
                  width: "100%", position: "relative", overflow: "hidden", textAlign: "left", border: `1.5px solid ${mine ? T.amber : T.border}`,
                  borderRadius: 10, padding: "9px 12px", marginBottom: 7, background: T.cardAlt, cursor: "pointer",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${pct}%`, background: T.amberDim, zIndex: 0 }} />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>{mine && <Check size={12} color={T.amber} />}{opt}</span>
                    <span style={{ fontSize: 11.5, color: T.muted }}>{count} oy · %{pct}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
