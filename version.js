// lib/socket.js — one shared socket connection for the whole app.
import { io } from "socket.io-client";
import { API_BASE } from "./api.js";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, { transports: ["websocket", "polling"] });
  }
  return socket;
}

export function joinTripRoom(tripId) {
  getSocket().emit("trip:join", tripId);
}
export function leaveTripRoom(tripId) {
  getSocket().emit("trip:leave", tripId);
}
