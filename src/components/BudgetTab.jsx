import React, { useState } from "react";
import {
  Wallet, Users, Receipt, ArrowRightLeft, Crown, X, UserPlus, Plus, Check,
  Trash2, HandCoins, Utensils, Car, Bed, Ticket, ShoppingBag, MoreHorizontal, AlertTriangle,
} from "lucide-react";
import { T, btnPrimary, btnGhost } from "../lib/theme.js";
import { Avatar, SectionLabel, Dashed, Empty, Field, AirmailStripe, StampBadge } from "./primitives.jsx";
import { fmtMoney, computeBalances, simplifyDebts, safeConfirm } from "../lib/utils.js";

const EXPENSE_CATEGORIES = [
  { key: "yeme-icme", label: "Yeme-içme", icon: Utensils },
  { key: "ulasim", label: "Ulaşım", icon: Car },
  { key: "konaklama", label: "Konaklama", icon: Bed },
  { key: "aktivite", label: "Aktivite", icon: Ticket },
  { key: "alisveris", label: "Alışveriş", icon: ShoppingBag },
  { key: "diger", label: "Diğer", icon: MoreHorizontal },
];
const categoryIcon = (key) => (EXPENSE_CATEGORIES.find(c => c.key === key) || EXPENSE_CATEGORIES[5]).icon;

export default function BudgetTab({ trip, fx, actions, myMemberId }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberWarning, setMemberWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [exp, setExp] = useState({ desc: "", amount: "", category: "diger", paidBy: trip.admin, splitAmong: trip.members.map(m => m.id) });

  const net = computeBalances(trip);
  const debts = simplifyDebts(net);
  const memberById = Object.fromEntries(trip.members.map(m => [m.id, m]));
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const currency = trip.currencyCode || "TRY";

  const addMember = async () => {
    if (!memberName.trim()) return;
    setBusy(true);
    try { await actions.addMember(memberName.trim()); setMemberName(""); setShowAddMember(false); }
    catch (e) { setMemberWarning(e.message); }
    finally { setBusy(false); }
  };
  const removeMember = async (id) => {
    if (id === trip.admin) return;
    setMemberWarning("");
    try { await actions.removeMember(id); }
    catch (e) { setMemberWarning(e.message); }
  };
  const submitExpense = async () => {
    const desc = exp.desc.trim();
    const amt = parseFloat(exp.amount);
    if (!desc || !amt || amt <= 0 || exp.splitAmong.length === 0) return;
    setBusy(true);
    try {
      await actions.addExpense({ desc, amount: amt, category: exp.category, paidBy: exp.paidBy, splitAmong: exp.splitAmong });
      setExp({ desc: "", amount: "", category: "diger", paidBy: trip.admin, splitAmong: trip.members.map(m => m.id) });
      setShowAddExpense(false);
    } finally { setBusy(false); }
  };
  const deleteExpense = (id) => {
    if (safeConfirm("Bu harcamayı silmek istediğine emin misin?")) actions.deleteExpense(id);
  };
  const toggleSplit = (id) => setExp(e => ({ ...e, splitAmong: e.splitAmong.includes(id) ? e.splitAmong.filter(x => x !== id) : [...e.splitAmong, id] }));
  const settleDebt = (d) => actions.settleDebt(d);

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}><AirmailStripe height={4} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1 }}>Toplam Harcama</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 700, color: T.amber, marginTop: 2 }}>{fmtMoney(total, currency)}</div>
            {fx && currency !== "TRY" && (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: T.muted, marginTop: 1 }}>≈ {fmtMoney(total * fx.rate, "TRY")}</div>
            )}
          </div>
          <StampBadge><Wallet size={22} /></StampBadge>
        </div>
        <Dashed />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.muted }}>
          <span>{trip.members.length} kişi ortak</span>
          <span>{trip.expenses.length} harcama</span>
        </div>
        {currency !== "TRY" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, background: T.amberDim, borderRadius: 10, padding: "7px 10px" }}>
            <span style={{ fontSize: 11.5, color: T.amber, fontWeight: 600 }}>Seyahat para birimi: {currency} · {trip.country}</span>
            {fx ? (
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: T.muted }}>1 {currency} ≈ {fx.rate.toFixed(2)} TRY</span>
            ) : (
              <span style={{ fontSize: 11, color: T.muted }}>kur alınıyor...</span>
            )}
          </div>
        )}
      </div>

      <SectionLabel icon={Users}>Katılımcılar</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {trip.members.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 10px 5px 5px" }}>
            <Avatar member={m} size={22} />
            <span style={{ fontSize: 12.5 }}>{m.name}{m.id === myMemberId && <span style={{ color: T.teal }}> (sen)</span>}</span>
            {m.id === trip.admin && <Crown size={11} color={T.amber} />}
            {m.id !== trip.admin && (
              <button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setShowAddMember(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1.5px dashed ${T.dash}`, borderRadius: 20, padding: "5px 12px", color: T.teal, fontSize: 12.5, cursor: "pointer" }}>
          <UserPlus size={13} /> Ekle
        </button>
      </div>
      {memberWarning && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.dangerDim, border: `1px solid rgba(226,87,76,0.3)`, borderRadius: 10, padding: "8px 12px", marginTop: 8, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.danger} style={{ flexShrink: 0 }} />
          {memberWarning}
        </div>
      )}
      {showAddMember && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Ad soyad"
            style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 16 }} />
          <button onClick={addMember} disabled={busy} style={{ ...btnPrimary, flex: "none", padding: "9px 14px" }}>Ekle</button>
        </div>
      )}

      <SectionLabel icon={Receipt}>Bakiye Özeti</SectionLabel>
      {debts.length === 0 && <Empty text="Herkes eşit — ödenecek borç yok." />}
      {debts.map((d, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: 13,
          background: (d.from === myMemberId || d.to === myMemberId) ? T.amberDim : "transparent",
          borderRadius: 10, marginBottom: 2,
        }}>
          <Avatar member={memberById[d.from]} size={24} />
          <span style={{ fontWeight: 600 }}>{memberById[d.from]?.name}{d.from === myMemberId && " (sen)"}</span>
          <ArrowRightLeft size={13} color={T.muted} />
          <span style={{ fontWeight: 600 }}>{memberById[d.to]?.name}{d.to === myMemberId && " (sen)"}</span>
          <Avatar member={memberById[d.to]} size={24} />
          <span style={{ marginLeft: "auto", textAlign: "right" }}>
            <span style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", color: T.danger, fontWeight: 600 }}>{fmtMoney(d.amount, currency)}</span>
            {fx && currency !== "TRY" && <span style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", color: T.muted, fontSize: 10.5 }}>≈ {fmtMoney(d.amount * fx.rate, "TRY")}</span>}
          </span>
          <button onClick={() => settleDebt(d)} title="Ödendi olarak işaretle" style={{
            background: T.tealDim, border: `1px solid rgba(79,168,216,0.4)`, borderRadius: 8, padding: "5px 8px",
            color: T.teal, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, flexShrink: 0,
          }}><HandCoins size={12} /> Öde</button>
        </div>
      ))}

      <SectionLabel icon={Wallet}>Harcamalar</SectionLabel>
      {trip.expenses.length === 0 && <Empty text="Henüz harcama eklenmedi." />}
      {trip.expenses.map(e => {
        const CatIcon = categoryIcon(e.category);
        return (
          <div key={e.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: e.isSettlement ? T.tealDim : T.amberDim, color: e.isSettlement ? T.teal : T.amber, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {e.isSettlement ? <HandCoins size={14} /> : <CatIcon size={14} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.desc}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
                    {e.isSettlement ? "ödeme kaydı" : `${memberById[e.paidBy]?.name || "?"} ödedi · ${e.splitAmong.length} kişiye bölüştü`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{fmtMoney(e.amount, currency)}</div>
                {fx && currency !== "TRY" && (
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.muted }}>≈ {fmtMoney(e.amount * fx.rate, "TRY")}</div>
                )}
                <button onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", marginTop: 2 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {!showAddExpense && (
        <button onClick={() => setShowAddExpense(true)} style={{ ...btnPrimary, width: "100%", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={16} /> Harcama Ekle
        </button>
      )}
      {showAddExpense && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14, marginTop: 8 }}>
          <Field label="Açıklama" value={exp.desc} onChange={v => setExp({ ...exp, desc: v })} placeholder="Örn. Akşam yemeği" />
          <Field label={`Tutar (${currency})`} value={exp.amount} onChange={v => setExp({ ...exp, amount: v })} placeholder="0.00" type="number" />
          {fx && currency !== "TRY" && parseFloat(exp.amount) > 0 && (
            <div style={{ fontSize: 12, color: T.amber, marginTop: -6, marginBottom: 10, fontFamily: "'JetBrains Mono',monospace" }}>
              ≈ {fmtMoney(parseFloat(exp.amount) * fx.rate, "TRY")}
            </div>
          )}
          <div style={{ fontSize: 11, color: T.muted, margin: "8px 0 5px" }}>Kategori</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setExp({ ...exp, category: c.key })} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20,
                border: `1px solid ${exp.category === c.key ? T.amber : T.border}`,
                background: exp.category === c.key ? T.amberDim : "transparent", color: T.text, fontSize: 12, cursor: "pointer",
              }}><c.icon size={12} />{c.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.muted, margin: "8px 0 5px" }}>Kim ödedi?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {trip.members.map(m => (
              <button key={m.id} onClick={() => setExp({ ...exp, paidBy: m.id })} style={{
                padding: "6px 10px", borderRadius: 20, border: `1px solid ${exp.paidBy === m.id ? T.amber : T.border}`,
                background: exp.paidBy === m.id ? T.amberDim : "transparent", color: T.text, fontSize: 12, cursor: "pointer",
              }}>{m.name}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.muted, margin: "8px 0 5px" }}>Kimler arasında bölüşülecek?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {trip.members.map(m => (
              <button key={m.id} onClick={() => toggleSplit(m.id)} style={{
                padding: "6px 10px", borderRadius: 20, border: `1px solid ${exp.splitAmong.includes(m.id) ? T.teal : T.border}`,
                background: exp.splitAmong.includes(m.id) ? T.tealDim : "transparent", color: T.text, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}>{exp.splitAmong.includes(m.id) && <Check size={11} />}{m.name}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submitExpense} disabled={busy} style={btnPrimary}>{busy ? "Kaydediliyor..." : "Kaydet"}</button>
            <button onClick={() => setShowAddExpense(false)} style={btnGhost}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
