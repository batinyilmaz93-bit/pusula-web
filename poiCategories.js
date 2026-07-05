// i18n.js — same "mutable object + listener" pattern as theme.js.
//
// Honest scope note: this covers the highest-visibility structural strings
// (nav labels, section headers, primary buttons, login screen) — not every
// piece of copy in the app (card descriptions, help text, etc. stay in
// Turkish regardless of language). Translating every string would mean
// touching ~200+ literal strings across every component; this covers the
// ~50 most load-bearing ones so the switcher is genuinely useful without
// that full-scope rewrite.
const TR = {
  navHome: "Ana Sayfa", navBudget: "Bütçe", navExplore: "Keşfet", navWeather: "Hava Durumu",
  navCurrency: "Döviz Kuru", navSecurity: "Güvenlik", navVlog: "Seyahat Vlogu", navMap: "Harita", navProfile: "Profilim",
  backToTrips: "Seyahatlere Dön", logout: "Çıkış Yap",
  save: "Kaydet", cancel: "Vazgeç", add: "Ekle", delete: "Sil", loading: "Yükleniyor...",
  loginTitle: "Giriş Yap", registerTitle: "Kayıt Ol", forgotPassword: "Şifremi unuttum",
  email: "E-posta", password: "Şifre", name: "Adın",
  totalExpense: "Toplam Harcama", participants: "Katılımcılar", balanceSummary: "Bakiye Özeti", expenses: "Harcamalar",
  addExpense: "Harcama Ekle", searchExpense: "Harcama ara...", all: "Tümü",
  appearance: "Görünüm", light: "Açık", dark: "Koyu", language: "Dil",
};
const EN = {
  navHome: "Home", navBudget: "Budget", navExplore: "Explore", navWeather: "Weather",
  navCurrency: "Currency", navSecurity: "Safety", navVlog: "Travel Vlog", navMap: "Map", navProfile: "Profile",
  backToTrips: "Back to Trips", logout: "Log Out",
  save: "Save", cancel: "Cancel", add: "Add", delete: "Delete", loading: "Loading...",
  loginTitle: "Log In", registerTitle: "Sign Up", forgotPassword: "Forgot password",
  email: "Email", password: "Password", name: "Your name",
  totalExpense: "Total Spend", participants: "Participants", balanceSummary: "Balance Summary", expenses: "Expenses",
  addExpense: "Add Expense", searchExpense: "Search expenses...", all: "All",
  appearance: "Appearance", light: "Light", dark: "Dark", language: "Language",
};

export const L = { ...TR };
const listeners = new Set();
export function onLanguageChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setLanguage(lang) {
  Object.assign(L, lang === "en" ? EN : TR);
  listeners.forEach(fn => fn());
}
