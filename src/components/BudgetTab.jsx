import React, { useState, useRef } from "react";
import {
  Wallet, Users, Receipt, ArrowRightLeft, Crown, X, UserPlus, Plus, Check,
  Trash2, HandCoins, Utensils, Car, Bed, Ticket, ShoppingBag, MoreHorizontal, AlertTriangle,
  Search, Camera, ImageOff, Bell,
} from "lucide-react";
import { T, btnPrimary, btnGhost } from "../lib/theme.js";
import { Avatar, SectionLabel, Dashed, Empty, Field, AirmailStripe, StampBadge, DonutChart } from "./primitives.jsx";
import { fmtMoney, computeBalances, simplifyDebts, safeConfirm, compressImageFile, extractAmountFromOcrText } from "../lib/utils.js";

const EXPENSE_CATEGORIES = [
  { key: "yeme-icme", label: "Yeme-içme", icon: Utensils, color: "#E2683D" },
  { key: "ulasim", label: "Ulaşım", icon: Car, color: "#2E9E98" },
  { key: "konaklama", label: "Konaklama", icon: Bed, color: "#C98BC9" },
  { key: "aktivite", label: "Aktivite", icon: Ticket, color: "#E0A83E" },
  { key: "alisveris", label: "Alışveriş", icon: ShoppingBag, color: "#D64545" },
  { key: "diger", label: "Diğer", icon: MoreHorizontal, color: "#9C8B72" },
];
const categoryIcon = (key) => (EXPENSE_CATEGORIES.find(c => c.key === key) || EXPENSE_CATEGORIES[5]).icon;
const categoryColor = (key) => (EXPENSE_CATEGORIES.find(c => c.key === key) || EXPENSE_CATEGORIES[5]).color;
const categoryLabel = (key) => (EXPENSE_CATEGORIES.find(c => c.key === key) || EXPENSE_CATEGORIES[5]).label;

export default function BudgetTab({ trip, fx, actions, myMemberId }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberWarning, setMemberWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [exp, setExp] = useState({ desc: "", amount: "", category: "diger", paidBy: trip.admin, splitAmong: trip.members.map(m => m.id) });
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState(null); // null = all
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrHint, setOcrHint] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  const net = computeBalances(trip);
  const debts = simplifyDebts(net);
  const memberById = Object.fromEntries(trip.members.map(m => [m.id, m]));
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const currency = trip.currencyCode || "TRY";
  const categoryTotals = EXPENSE_CATEGORIES.map(c => ({
    key: c.key, color: c.color, label: c.label,
    value: trip.expenses.filter(e => !e.isSettlement && e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  const spendTotal = categoryTotals.reduce((s, c) => s + c.value, 0);
  const filteredExpenses = trip.expenses.filter(e => {
    if (expenseCategoryFilter && e.category !== expenseCategoryFilter) return false;
    if (expenseSearch.trim() && !e.desc.toLocaleLowerCase("tr-TR").includes(expenseSearch.trim().toLocaleLowerCase("tr-TR"))) return false;
    return true;
  });

  const addMember = async () => {
    if (!memberName.trim()) return;
    setBusy(true);
    try {
      await actions.addMember(memberName.trim(), memberEmail.trim() || undefined);
      setMemberName(""); setMemberEmail(""); setShowAddMember(false);
    }
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
      await actions.addExpense({ desc, amount: amt, category: exp.category, paidBy: exp.paidBy, splitAmong: exp.splitAmong, receiptPhoto: photoPreview || undefined });
      setExp({ desc: "", amount: "", category: "diger", paidBy: trip.admin, splitAmong: trip.members.map(m => m.id) });
      setPhotoPreview(null); setPhotoError("");
      setShowAddExpense(false);
    } finally { setBusy(false); }
  };
  const handlePhotoSelect = async (file) => {
    if (!file) return;
    setPhotoError("");
    if (!file.type.startsWith("image/")) { setPhotoError("Sadece görsel dosyası yükleyebilirsin."); return; }
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      setPhotoPreview(dataUrl);
      // Best-effort OCR suggestion — runs client-side (no server/API key),
      // only pre-fills the amount if the field is still empty, and always
      // stays editable since receipt OCR is inherently unreliable.
      setOcrBusy(true);
      import("tesseract.js").then(async ({ recognize }) => {
        try {
          const { data } = await recognize(dataUrl, "eng");
          const guess = extractAmountFromOcrText(data.text);
          if (guess && !exp.amount) {
            setExp(x => x.amount ? x : { ...x, amount: String(guess) });
            setOcrHint(`Fişten ~${guess} tahmin edildi — tutarı kontrol et.`);
          }
        } catch { /* OCR is a bonus, not required — fail silently */ }
        finally { setOcrBusy(false); }
      }).catch(() => setOcrBusy(false));
    } catch (e) {
      setPhotoError(e.message || "Fotoğraf işlenemedi.");
    } finally {
      setPhotoBusy(false);
    }
  };
  const deleteExpense = (id) => {
    if (safeConfirm("Bu harcamayı silmek istediğine emin misin?")) actions.deleteExpense(id);
  };
  const toggleSplit = (id) => setExp(e => ({ ...e, splitAmong: e.splitAmong.includes(id) ? e.splitAmong.filter(x => x !== id) : [...e.splitAmong, id] }));
  const settleDebt = (d) => actions.settleDebt(d);
  const [reminding, setReminding] = useState(null);
  const remindDebt = async (d) => {
    setReminding(d.from + d.to);
    try { await actions.remindDebt(d.from, d.amount); } finally { setReminding(null); }
  };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${T.cardAlt}, ${T.card})`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden", boxShadow: T.shadow }}>
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

      {categoryTotals.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginTop: 10, boxShadow: T.shadowSoft, display: "flex", alignItems: "center", gap: 16 }}>
          <DonutChart
            segments={categoryTotals}
            centerLabel="Toplam"
            centerValue={`${Math.round(spendTotal).toLocaleString("tr-TR")}`}
          />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
            {categoryTotals.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ color: T.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                <span style={{ color: T.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, flexShrink: 0 }}>
                  %{Math.round((c.value / spendTotal) * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.dangerDim, border: `1px solid rgba(194,76,66,0.3)`, borderRadius: 10, padding: "8px 12px", marginTop: 8, fontSize: 12 }}>
          <AlertTriangle size={13} color={T.danger} style={{ flexShrink: 0 }} />
          {memberWarning}
        </div>
      )}
      {showAddMember && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginTop: 10, boxShadow: T.shadowSoft }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>Ad soyad</div>
          <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Ad soyad"
            style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 16, marginBottom: 10, boxSizing: "border-box" }} />
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>E-posta (opsiyonel — girersen davet e-postası gider)</div>
          <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="ornek@eposta.com" type="email"
            style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 16, marginBottom: 10, boxSizing: "border-box" }} />
          <button onClick={addMember} disabled={busy} style={{ ...btnPrimary, width: "100%" }}>{busy ? "Ekleniyor..." : "Ekle"}</button>
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
            background: T.tealDim, border: `1px solid rgba(91,155,213,0.4)`, borderRadius: 8, padding: "8px 12px",
            color: T.teal, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, flexShrink: 0,
          }}><HandCoins size={12} /> Öde</button>
          {d.to === myMemberId && (
            <button onClick={() => remindDebt(d)} disabled={reminding === (d.from + d.to)} title="Hatırlatma gönder" style={{
              background: T.amberDim, border: `1px solid rgba(107,142,78,0.4)`, borderRadius: 8, padding: "8px 10px",
              color: T.amber, cursor: "pointer", display: "flex", alignItems: "center", fontSize: 11.5, flexShrink: 0,
            }}><Bell size={12} /></button>
          )}
        </div>
      ))}

      <SectionLabel icon={Wallet}>Harcamalar</SectionLabel>
      {trip.expenses.length > 0 && !showAddExpense && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search size={14} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} placeholder="Harcama ara..."
              style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px 9px 34px", color: T.text, fontSize: 16, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => setExpenseCategoryFilter(null)} style={{
              padding: "5px 10px", borderRadius: 20, border: `1px solid ${!expenseCategoryFilter ? T.amber : T.border}`,
              background: !expenseCategoryFilter ? T.amberDim : "transparent", color: T.text, fontSize: 11.5, cursor: "pointer",
            }}>Tümü</button>
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setExpenseCategoryFilter(f => f === c.key ? null : c.key)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20,
                border: `1px solid ${expenseCategoryFilter === c.key ? T.amber : T.border}`,
                background: expenseCategoryFilter === c.key ? T.amberDim : "transparent", color: T.text, fontSize: 11.5, cursor: "pointer",
              }}><c.icon size={11} />{c.label}</button>
            ))}
          </div>
        </div>
      )}
      {trip.expenses.length === 0 && <Empty text="Henüz harcama eklenmedi." />}
      {trip.expenses.length > 0 && filteredExpenses.length === 0 && <Empty text="Bu aramaya/kategoriye uyan harcama yok." />}
      {filteredExpenses.map(e => {
        const CatIcon = categoryIcon(e.category);
        return (
          <div key={e.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                {e.receiptPhoto ? (
                  <img src={e.receiptPhoto} onClick={() => setLightbox(e.receiptPhoto)} alt="Fiş"
                    style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, objectFit: "cover", cursor: "pointer" }} />
                ) : (
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: e.isSettlement ? T.tealDim : `${categoryColor(e.category)}22`,
                    color: e.isSettlement ? T.teal : categoryColor(e.category),
                  }}>
                    {e.isSettlement ? <HandCoins size={14} /> : <CatIcon size={14} />}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.desc}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
                    {e.isSettlement ? "ödeme kaydı" : `${categoryLabel(e.category)} · ${memberById[e.paidBy]?.name || "?"} ödedi · ${e.splitAmong.length} kişiye bölüştü`}
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

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
        }}>
          <img src={lightbox} alt="Fiş büyük" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
        </div>
      )}

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

          <div style={{ fontSize: 11, color: T.muted, margin: "8px 0 5px" }}>Fiş fotoğrafı (opsiyonel)</div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handlePhotoSelect(e.target.files?.[0])} />
          {!photoPreview ? (
            <button onClick={() => fileInputRef.current?.click()} disabled={photoBusy} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
              background: T.cardAlt, border: `1.5px dashed ${T.dash}`, borderRadius: 10, padding: "10px", color: T.teal,
              fontSize: 13, cursor: "pointer", marginBottom: 12,
            }}>
              <Camera size={15} /> {photoBusy ? "İşleniyor..." : "Fotoğraf Ekle"}
            </button>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={photoPreview} alt="Önizleme" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }} />
                <button onClick={() => { setPhotoPreview(null); setOcrHint(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} style={{
                  display: "flex", alignItems: "center", gap: 5, background: T.dangerDim, border: "none", borderRadius: 8,
                  padding: "7px 10px", color: T.danger, fontSize: 12, cursor: "pointer",
                }}><ImageOff size={13} /> Kaldır</button>
              </div>
              {ocrBusy && <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Fiş okunuyor...</div>}
              {!ocrBusy && ocrHint && <div style={{ fontSize: 11, color: T.teal, marginTop: 6 }}>{ocrHint}</div>}
            </div>
          )}
          {photoError && <div style={{ color: T.danger, fontSize: 11.5, marginBottom: 10 }}>{photoError}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submitExpense} disabled={busy} style={btnPrimary}>{busy ? "Kaydediliyor..." : "Kaydet"}</button>
            <button onClick={() => setShowAddExpense(false)} style={btnGhost}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
