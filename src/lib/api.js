// lib/api.js — talks to the Pusula backend (see /server in the project you
// already have). Every function throws a plain Error with a Turkish message
// pulled from the server's { error } response, so components can just catch
// and show err.message.

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const AUTH_KEY = "pusula_auth";

let unauthorizedHandler = null;
export function onUnauthorized(fn) { unauthorizedHandler = fn; }

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; }
}
export function setAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function requestOnce(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const a = getAuth();
    if (a?.token) headers.Authorization = `Bearer ${a.token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth) {
    clearAuth();
    if (unauthorizedHandler) unauthorizedHandler();
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data?.error || `İstek başarısız (${res.status})`);
  return data;
}

// Free-tier hosts (Render) spin down after idling and can take up to ~50
// seconds to fully wake back up, bouncing early requests with a quick
// 502/503 in the meantime. The previous retry window (~4.5s total) gave up
// long before that finished, which is exactly why "canlı" data kept falling
// back to offline fallbacks. This window now spans ~60s across 8 attempts.
async function request(path, opts = {}) {
  const method = opts.method || "GET";
  if (method !== "GET") return requestOnce(path, opts);
  const delays = opts.retrySchedule || [0, 1500, 3000, 5000, 7000, 9000, 12000, 15000];
  let lastErr;
  for (const d of delays) {
    if (d) await sleep(d);
    try { return await requestOnce(path, opts); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}
const SHORT_RETRY = [0, 1000, 2000, 3000]; // ~6s — used where a good fallback exists

/* ---- auth ---- */
export const registerDevice = (name) => request("/api/auth/device", { method: "POST", body: { name }, auth: false });
export const registerApi = (email, password, name) => request("/api/auth/register", { method: "POST", body: { email, password, name }, auth: false });
export const loginApi = (email, password) => request("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
export const requestResetApi = (email) => request("/api/auth/request-reset", { method: "POST", body: { email }, auth: false });
export const confirmResetApi = (token, password) => request("/api/auth/confirm-reset", { method: "POST", body: { token, password }, auth: false });
export const updateProfileApi = (name) => request("/api/auth/profile", { method: "PATCH", body: { name } });

/* ---- trips ---- */
export const listTrips = () => request("/api/trips");
export const createTrip = (payload) => request("/api/trips", { method: "POST", body: payload });
export const joinTrip = (inviteCode) => request("/api/trips/join", { method: "POST", body: { inviteCode } });
export const getTrip = (id) => request(`/api/trips/${id}`);
export const deleteTripApi = (id) => request(`/api/trips/${id}`, { method: "DELETE" });
export const updateTripCurrencyApi = (tripId, currencyCode) => request(`/api/trips/${tripId}`, { method: "PATCH", body: { currencyCode } });

/* ---- members ---- */
export const addMemberApi = (tripId, name, email) => request(`/api/trips/${tripId}/members`, { method: "POST", body: { name, email } });
export const removeMemberApi = (tripId, memberId) => request(`/api/trips/${tripId}/members/${memberId}`, { method: "DELETE" });
export const leaveTripApi = (tripId, myMemberId) => removeMemberApi(tripId, myMemberId);

/* ---- expenses ---- */
export const addExpenseApi = (tripId, payload) => request(`/api/trips/${tripId}/expenses`, { method: "POST", body: payload });
export const deleteExpenseApi = (tripId, expenseId) => request(`/api/trips/${tripId}/expenses/${expenseId}`, { method: "DELETE" });
export const settleDebtApi = (tripId, payload) => request(`/api/trips/${tripId}/settle`, { method: "POST", body: payload });

/* ---- hazards ---- */
export const addHazardApi = (tripId, text) => request(`/api/trips/${tripId}/hazards`, { method: "POST", body: { text } });
export const deleteHazardApi = (tripId, hazardId) => request(`/api/trips/${tripId}/hazards/${hazardId}`, { method: "DELETE" });

/* ---- proxy (weather / currency / places / news) ---- */
const qs = (obj) => Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

export const proxyGeocode = (city, country) => request(`/api/proxy/geocode?${qs({ city, country })}`, { retrySchedule: SHORT_RETRY });
export const proxyWeather = (lat, lon, timezone) => request(`/api/proxy/weather?${qs({ lat, lon, timezone })}`);
export const proxyFx = (country) => request(`/api/proxy/fx?${qs({ country })}`);
export const proxyPoi = (lat, lon, nocache) => request(`/api/proxy/poi?${qs({ lat, lon, nocache: nocache ? 1 : undefined })}`);
export const proxyNews = (country) => request(`/api/proxy/news?${qs({ country })}`);

export const API_BASE = BASE;
