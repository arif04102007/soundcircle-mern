const { Server } = require("socket.io");
const Session = require("../models/Session");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const { config, corsOrigin } = require("../config");
const { rooms, generateCode, findByHostUser } = require("./roomStore");

const ALLOWED_REACTIONS = new Set(["🔥", "❤️", "😂", "👏", "🎵"]);
const JOIN_FAIL_LIMIT = 10;
const JOIN_WINDOW_MS = 60_000;
const failedJoins = new Map(); // ip -> { count, resetAt }

function clientIp(socket) {
  const fwd = socket.handshake.headers["x-forwarded-for"];
  return (fwd ? String(fwd).split(",")[0].trim() : socket.handshake.address) || "unknown";
}
function joinBlocked(ip) {
  const e = failedJoins.get(ip);
  return !!e && Date.now() < e.resetAt && e.count >= JOIN_FAIL_LIMIT;
}
function noteFailedJoin(ip) {
  const now = Date.now();
  const e = failedJoins.get(ip);
  if (!e || now > e.resetAt) failedJoins.set(ip, { count: 1, resetAt: now + JOIN_WINDOW_MS });
  else e.count += 1;
}

const cleanName = (n, fallback) => String(n || "").replace(/[<>]/g, "").trim().slice(0, 24) || fallback;
const snapshot = (room) => ({
  code: room.code,
  title: room.title,
  hostName: room.hostName,
  live: room.live,
  hostOnline: !!room.hostSocketId,
  listeners: [...room.listeners.values()].map(({ id, name }) => ({ id, name })),
});

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin(), methods: ["GET", "POST"] },
    pingInterval: 20_000,
    pingTimeout: 30_000,
  });

  // Optional auth: hosts send a JWT, listeners connect anonymously.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      const userId = verifyToken(token);
      if (!userId) return next(new Error("UNAUTHORIZED"));
      socket.data.userId = userId;
    }
    next();
  });

  function bankLiveTime(room) {
    if (room.live && room.liveSince) room.liveSeconds += (Date.now() - room.liveSince) / 1000;
    room.liveSince = room.live ? Date.now() : null;
  }

  async function closeRoom(room, reason) {
    if (!rooms.delete(room.code)) return; // already closed
    clearTimeout(room.graceTimer);
    bankLiveTime(room);
    io.to(room.code).emit("room:closed", { reason });
    io.in(room.code).socketsLeave(room.code);
    try {
      await Session.findByIdAndUpdate(room.sessionId, {
        status: "ended",
        endReason: reason,
        endedAt: new Date(),
        durationSec: Math.round((Date.now() - room.createdAt) / 1000),
        liveSeconds: Math.round(room.liveSeconds),
        peakListeners: room.peak,
        uniqueListeners: room.uniqueClients.size,
        reactionCount: room.reactions,
      });
    } catch (e) {
      console.error("Failed to persist session", room.code, e.message);
    }
  }

  io.on("connection", (socket) => {
    const roomOf = () => rooms.get(socket.data.code);
    const isHost = () => socket.data.role === "host";

    // ───────────── HOST ─────────────
    socket.on("host:create", async ({ title } = {}, ack) => {
      if (typeof ack !== "function") return;
      if (!socket.data.userId) return ack({ ok: false, code: "UNAUTHORIZED", error: "Sign in to host a room." });
      try {
        // Duplicate-operation guard: one open room per host. A refresh or second tab re-attaches to it.
        const existing = findByHostUser(socket.data.userId);
        if (existing) {
          clearTimeout(existing.graceTimer);
          const stale = existing.hostSocketId && existing.hostSocketId !== socket.id ? io.sockets.sockets.get(existing.hostSocketId) : null;
          if (stale) { stale.data.role = null; stale.data.code = null; stale.emit("room:taken_over"); stale.leave(existing.code); }
          existing.hostSocketId = socket.id;
          socket.join(existing.code);
          Object.assign(socket.data, { role: "host", code: existing.code });
          io.to(existing.code).emit("room:host_status", { online: true, hostId: socket.id });
          return ack({ ok: true, resumed: true, room: snapshot(existing) });
        }

        const user = await User.findById(socket.data.userId);
        if (!user) return ack({ ok: false, code: "UNAUTHORIZED", error: "Account not found. Please sign in again." });
        const code = generateCode();
        if (!code) return ack({ ok: false, code: "FULL", error: "All rooms are busy right now. Try again shortly." });

        const roomTitle = cleanName(title, "Untitled room");
        const session = await Session.create({ host: user._id, hostName: user.name, code, title: roomTitle });
        const room = {
          code, title: roomTitle, hostUserId: socket.data.userId, hostName: user.name, hostSocketId: socket.id,
          sessionId: session._id, listeners: new Map(), uniqueClients: new Set(), peak: 0, reactions: 0,
          live: false, liveSince: null, liveSeconds: 0, createdAt: Date.now(), lastActivity: Date.now(), graceTimer: null,
        };
        rooms.set(code, room);
        socket.join(code);
        Object.assign(socket.data, { role: "host", code });
        ack({ ok: true, resumed: false, room: snapshot(room) });
      } catch (e) {
        console.error("host:create failed", e);
        ack({ ok: false, code: "INTERNAL", error: "Couldn't open the room. Please try again." });
      }
    });

    socket.on("host:live", ({ live } = {}, ack) => {
      const room = roomOf();
      if (!room || !isHost()) return ack?.({ ok: false, error: "Not hosting a room." });
      bankLiveTime(room);
      room.live = !!live;
      room.liveSince = room.live ? Date.now() : null;
      room.lastActivity = Date.now();
      io.to(room.code).emit("room:live", { live: room.live });
      ack?.({ ok: true });
    });

    socket.on("host:end", async (_p, ack) => {
      const room = roomOf();
      if (!room || !isHost()) return ack?.({ ok: false, error: "Not hosting a room." });
      await closeRoom(room, "host_ended");
      ack?.({ ok: true });
    });

    // ───────────── LISTENER ─────────────
    socket.on("listener:join", ({ code, name, clientId } = {}, ack) => {
      if (typeof ack !== "function") return;
      const ip = clientIp(socket);
      if (joinBlocked(ip)) return ack({ ok: false, code: "RATE_LIMITED", error: "Too many wrong codes. Wait a minute and try again." });
      if (!/^\d{4}$/.test(String(code))) return ack({ ok: false, code: "INVALID_CODE", error: "Room codes are 4 digits." });
      const room = rooms.get(String(code));
      if (!room) {
        noteFailedJoin(ip);
        return ack({ ok: false, code: "NOT_FOUND", error: "No room with that code. Check it with your host." });
      }
      if (socket.data.code && socket.data.code !== room.code) return ack({ ok: false, code: "ALREADY_IN_ROOM", error: "Leave your current room first." });

      const listener = { id: socket.id, name: cleanName(name, `Guest ${socket.id.slice(0, 3)}`) };
      room.listeners.set(socket.id, listener);
      room.uniqueClients.add(String(clientId || socket.id));
      room.peak = Math.max(room.peak, room.listeners.size);
      room.lastActivity = Date.now();
      socket.join(room.code);
      Object.assign(socket.data, { role: "listener", code: room.code });

      if (room.hostSocketId) io.to(room.hostSocketId).emit("listener:joined", { ...listener, count: room.listeners.size });
      socket.to(room.code).emit("room:count", { count: room.listeners.size });
      ack({ ok: true, room: { ...snapshot(room), hostId: room.hostSocketId, listeners: undefined, count: room.listeners.size, iceReady: true } });
    });

    socket.on("listener:leave", () => detachListener(socket));
    socket.on("listener:latency", ({ rtt } = {}) => {
      const room = roomOf();
      if (room?.hostSocketId && socket.data.role === "listener" && Number.isFinite(rtt))
        io.to(room.hostSocketId).emit("listener:latency", { id: socket.id, rtt: Math.round(rtt) });
    });
    socket.on("latency:ping", (ack) => typeof ack === "function" && ack());

    // ───────────── SHARED ─────────────
    // Generic WebRTC relay; only between sockets that are in the same room.
    socket.on("signal", ({ to, data } = {}) => {
      const peer = io.sockets.sockets.get(to);
      if (!peer || !socket.data.code || peer.data.code !== socket.data.code) return;
      peer.emit("signal", { from: socket.id, data });
    });

    socket.on("reaction", ({ emoji } = {}) => {
      const room = roomOf();
      if (!room || !ALLOWED_REACTIONS.has(emoji)) return;
      room.reactions += 1;
      room.lastActivity = Date.now();
      io.to(room.code).emit("reaction", { emoji, from: socket.id });
    });

    socket.on("disconnect", () => {
      const room = roomOf();
      if (!room) return;
      if (isHost()) {
        if (room.hostSocketId !== socket.id) return; // replaced by a newer tab
        room.hostSocketId = null;
        io.to(room.code).emit("room:host_status", { online: false, graceMs: config.hostGraceMs });
        // Reliability: give the host a window to reconnect (refresh, flaky Wi-Fi) before closing the room.
        room.graceTimer = setTimeout(() => closeRoom(room, "host_disconnected"), config.hostGraceMs);
      } else {
        detachListener(socket);
      }
    });
  });

  function detachListener(socket) {
    const room = rooms.get(socket.data.code);
    if (!room || socket.data.role !== "listener") return;
    room.listeners.delete(socket.id);
    socket.leave(room.code);
    socket.data.code = null;
    socket.data.role = null;
    if (room.hostSocketId) io.to(room.hostSocketId).emit("listener:left", { id: socket.id, count: room.listeners.size });
    io.to(room.code).emit("room:count", { count: room.listeners.size });
  }

  // Close rooms nobody has touched for a few hours.
  const sweeper = setInterval(() => {
    for (const room of rooms.values()) if (Date.now() - room.lastActivity > config.staleRoomMs) closeRoom(room, "expired");
  }, 5 * 60_000);
  sweeper.unref();

  io.closeAllRooms = async () => { for (const room of [...rooms.values()]) await closeRoom(room, "server_shutdown"); };
  return io;
}

module.exports = { initSockets };
