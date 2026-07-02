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

async function request(path, { method = "GET", body, auth = true } = {}) {
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

/* ---- auth ---- */
export const registerDevice = (name) => request("/api/auth/device", { method: "POST", body: { name }, auth: false });

/* ---- trips ---- */
export const listTrips = () => request("/api/trips");
export const createTrip = (payload) => request("/api/trips", { method: "POST", body: payload });
export const joinTrip = (inviteCode) => request("/api/trips/join", { method: "POST", body: { inviteCode } });
export const getTrip = (id) => request(`/api/trips/${id}`);
export const deleteTripApi = (id) => request(`/api/trips/${id}`, { method: "DELETE" });

/* ---- members ---- */
export const addMemberApi = (tripId, name) => request(`/api/trips/${tripId}/members`, { method: "POST", body: { name } });
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

export const proxyGeocode = (city, country) => request(`/api/proxy/geocode?${qs({ city, country })}`);
export const proxyWeather = (lat, lon, timezone) => request(`/api/proxy/weather?${qs({ lat, lon, timezone })}`);
export const proxyFx = (country) => request(`/api/proxy/fx?${qs({ country })}`);
export const proxyPoi = (lat, lon, nocache) => request(`/api/proxy/poi?${qs({ lat, lon, nocache: nocache ? 1 : undefined })}`);
export const proxyNews = (country) => request(`/api/proxy/news?${qs({ country })}`);

export const API_BASE = BASE;
