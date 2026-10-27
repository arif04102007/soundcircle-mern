// End-to-end test: real Express + Socket.io + MongoDB. Run with `npm test` (needs MONGODB_URI).
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-test-secret-test-secret-123";
process.env.HOST_GRACE_MS = "400";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soundcircle_test";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const mongoose = require("mongoose");
const { io: connect } = require("socket.io-client");
const { createApp } = require("../src/app");
const { initSockets } = require("../src/sockets");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

let server, io, base;
const sockets = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const once = (s, ev, ms = 2000) =>
  new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout waiting for ${ev}`)), ms);
    s.once(ev, (d) => { clearTimeout(t); res(d); });
  });
const emit = (s, ev, payload) => new Promise((res) => s.emit(ev, payload, res));
const api = async (path, { method = "GET", token, body } = {}) => {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: r.status === 204 ? null : await r.json() };
};
const sock = (token) => {
  const s = connect(base, { auth: token ? { token } : {}, transports: ["websocket"], forceNew: true });
  sockets.push(s);
  return new Promise((res, rej) => { s.on("connect", () => res(s)); s.on("connect_error", rej); });
};

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  server = http.createServer(createApp());
  io = initSockets(server);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  sockets.forEach((s) => s.close());
  await io.closeAllRooms();
  await new Promise((r) => server.close(r));
  await mongoose.disconnect();
});

let tokenA, tokenB, code, sessionId;

test("auth: validation, register, duplicate, login, me", async () => {
  assert.equal((await api("/api/auth/register", { method: "POST", body: { name: "A", email: "bad", password: "x" } })).status, 400);
  const reg = await api("/api/auth/register", { method: "POST", body: { name: "Asha", email: "Asha@Test.com", password: "password123" } });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.email, "asha@test.com");
  assert.ok(!("passwordHash" in reg.body.user));
  tokenA = reg.body.token;
  assert.equal((await api("/api/auth/register", { method: "POST", body: { name: "Asha", email: "asha@test.com", password: "password123" } })).status, 409);
  assert.equal((await api("/api/auth/login", { method: "POST", body: { email: "asha@test.com", password: "nope-nope" } })).status, 401);
  const login = await api("/api/auth/login", { method: "POST", body: { email: "asha@test.com", password: "password123" } });
  assert.equal(login.status, 200);
  assert.equal((await api("/api/auth/me", { token: login.body.token })).body.user.name, "Asha");
  tokenB = (await api("/api/auth/register", { method: "POST", body: { name: "Ben", email: "ben@test.com", password: "password123" } })).body.token;
  assert.equal((await api("/api/sessions")).status, 401);
  assert.equal((await api("/api/auth/me", { token: "garbage" })).status, 401);
});

test("hosting requires auth; one open room per host (resume + takeover)", async () => {
  const anon = await sock();
  assert.equal((await emit(anon, "host:create", { title: "x" })).code, "UNAUTHORIZED");

  const host = await sock(tokenA);
  const created = await emit(host, "host:create", { title: "Friday <b>lofi</b>" });
  assert.equal(created.ok, true);
  assert.match(created.room.code, /^\d{4}$/);
  assert.equal(created.room.title, "Friday blofi/b");
  code = created.room.code;

  const second = await sock(tokenA);
  const takenOver = once(host, "room:taken_over");
  const again = await emit(second, "host:create", {});
  assert.equal(again.resumed, true);
  assert.equal(again.room.code, code);
  await takenOver;
  second.disconnect(); // let the grace window handle this; reconnect below keeps room alive
  await wait(100);
  const host2 = await sock(tokenA);
  const back = await emit(host2, "host:create", {});
  assert.equal(back.resumed, true, "reconnect within grace window resumes the same room");
  sockets.push(host2);
  host2.hostRef = true;
  global.__host = host2;
});

test("public room lookup", async () => {
  assert.equal((await api(`/api/room/${code}`)).body.title, "Friday blofi/b");
  assert.equal((await api("/api/room/0000")).status, 404);
  assert.equal((await api("/api/room/abcd")).status, 404);
  assert.ok((await api("/api/config/ice")).body.iceServers.length >= 2);
});

test("listener join, live broadcast, signaling relay, reactions", async () => {
  const host = global.__host;
  const l1 = await sock();
  const joined = once(host, "listener:joined");
  const res = await emit(l1, "listener:join", { code, name: "Mira", clientId: "c1" });
  assert.equal(res.ok, true);
  assert.equal(res.room.hostId, host.id);
  const j = await joined;
  assert.equal(j.name, "Mira");
  assert.equal(j.count, 1);

  const liveEvt = once(l1, "room:live");
  assert.equal((await emit(host, "host:live", { live: true })).ok, true);
  assert.equal((await liveEvt).live, true);

  // WebRTC signaling is relayed inside the room…
  const sig = once(l1, "signal");
  host.emit("signal", { to: l1.id, data: { type: "offer", sdp: "x" } });
  assert.equal((await sig).data.type, "offer");
  // …but never to sockets outside it.
  const outsider = await sock();
  let leaked = false;
  outsider.on("signal", () => (leaked = true));
  host.emit("signal", { to: outsider.id, data: { type: "offer" } });
  await wait(150);
  assert.equal(leaked, false);

  // reactions: allowlisted only, and delivered to the whole room
  const r = once(host, "reaction");
  l1.emit("reaction", { emoji: "🔥" });
  assert.equal((await r).emoji, "🔥");
  let bad = false;
  host.on("reaction", (x) => x.emoji === "💣" && (bad = true));
  l1.emit("reaction", { emoji: "💣" });
  await wait(150);
  assert.equal(bad, false);

  const lat = once(host, "listener:latency");
  l1.emit("listener:latency", { rtt: 42.4 });
  assert.equal((await lat).rtt, 42);

  const l2 = await sock();
  await emit(l2, "listener:join", { code, name: "Ravi", clientId: "c2" });
  const left = once(host, "listener:left");
  l2.emit("listener:leave");
  assert.equal((await left).count, 1);
});

test("host ends room: listeners are told, history is persisted", async () => {
  const host = global.__host;
  const l = await sock();
  await emit(l, "listener:join", { code, name: "Zed", clientId: "c3" });
  const closed = once(l, "room:closed");
  assert.equal((await emit(host, "host:end")).ok, true);
  assert.equal((await closed).reason, "host_ended");
  assert.equal((await api(`/api/room/${code}`)).status, 404);

  const list = await api("/api/sessions", { token: tokenA });
  assert.equal(list.body.total, 1);
  const s = list.body.items[0];
  sessionId = s.id;
  assert.equal(s.status, "ended");
  assert.equal(s.endReason, "host_ended");
  assert.equal(s.peakListeners, 2);
  assert.equal(s.uniqueListeners, 3);
  assert.equal(s.reactionCount, 1);
});

test("sessions: stats, ownership (403/404/400), delete rules", async () => {
  const stats = await api("/api/sessions/stats", { token: tokenA });
  assert.equal(stats.status, 200);
  assert.equal(stats.body.totals.sessions, 1);
  assert.equal(stats.body.totals.listeners, 3);
  assert.equal(stats.body.totals.peakListeners, 2);
  assert.equal(stats.body.totals.reactions, 1);
  assert.ok(stats.body.totals.liveSeconds >= 0);
  assert.equal(stats.body.days.at(-1).listeners, 3);
  assert.equal(stats.body.days.length, 14);
  assert.equal((await api(`/api/sessions/${sessionId}`, { token: tokenB })).status, 403);
  assert.equal((await api("/api/sessions/64b000000000000000000000", { token: tokenA })).status, 404);
  assert.equal((await api("/api/sessions/not-an-id", { token: tokenA })).status, 400);
  assert.equal((await api(`/api/sessions/${sessionId}`, { method: "DELETE", token: tokenB })).status, 403);
  assert.equal((await api(`/api/sessions/${sessionId}`, { method: "DELETE", token: tokenA })).status, 204);
  assert.equal((await api("/api/sessions", { token: tokenA })).body.total, 0);
});

test("host disconnect: listeners warned, room closes after grace, session saved", async () => {
  const host = await sock(tokenB);
  const { room } = await emit(host, "host:create", { title: "Grace test" });
  const l = await sock();
  await emit(l, "listener:join", { code: room.code, name: "Q", clientId: "c9" });
  const status = once(l, "room:host_status");
  host.disconnect();
  assert.equal((await status).online, false);
  const closed = await once(l, "room:closed", 3000);
  assert.equal(closed.reason, "host_disconnected");
  await wait(100);
  const s = (await api("/api/sessions", { token: tokenB })).body.items[0];
  assert.equal(s.endReason, "host_disconnected");
  assert.equal(s.status, "ended");
});

test("join errors and brute-force rate limiting (runs last: it blocks this IP)", async () => {
  const l = await sock();
  assert.equal((await emit(l, "listener:join", { code: "12", name: "x" })).code, "INVALID_CODE");
  let last;
  for (let i = 0; i < 11; i++) last = await emit(l, "listener:join", { code: "0000", name: "x" });
  assert.equal(last.code, "RATE_LIMITED");
});
