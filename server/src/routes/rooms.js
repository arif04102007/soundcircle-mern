const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { config } = require("../config");
const { rooms } = require("../sockets/roomStore");

// Codes are only 4 digits, so probing the lookup endpoint is rate limited per IP.
const lookupLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many lookups. Wait a minute and try again.", code: "RATE_LIMITED" },
});

router.get("/room/:code", lookupLimiter, (req, res) => {
  const room = /^\d{4}$/.test(req.params.code) ? rooms.get(req.params.code) : null;
  if (!room) return res.status(404).json({ error: "No room with that code.", code: "NOT_FOUND" });
  res.json({ code: room.code, title: room.title, hostName: room.hostName, live: room.live, listeners: room.listeners.size });
});

// ICE servers for WebRTC. Add your own TURN via env for listeners behind strict NATs.
router.get("/config/ice", (_req, res) => {
  const iceServers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  if (config.turn.urls.length) {
    iceServers.push({ urls: config.turn.urls, username: config.turn.username, credential: config.turn.credential });
  } else if (!config.isProd) {
    // Dev-only fallback: public TURN relay for testing behind NATs.
    // Do NOT use in production – it is rate-limited and unreliable.
    iceServers.push({
      urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"],
      username: "openrelayproject",
      credential: "openrelayproject",
    });
  } else {
    // Production with no TURN configured: log once so ops can act on it.
    console.warn("[ICE] No TURN server configured. Listeners behind strict NATs may fail to connect.");
  }
  res.json({ iceServers });
});

module.exports = router;
