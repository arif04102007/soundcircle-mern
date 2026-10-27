const router = require("express").Router();
const mongoose = require("mongoose");
const Session = require("../models/Session");
const { requireAuth } = require("../middleware/auth");
const { AppError } = require("../utils/errors");

router.use(requireAuth);

const toDto = (s) => ({
  id: s._id.toString(),
  code: s.code,
  title: s.title,
  status: s.status,
  startedAt: s.startedAt,
  endedAt: s.endedAt,
  endReason: s.endReason,
  durationSec: s.durationSec,
  liveSeconds: s.liveSeconds,
  peakListeners: s.peakListeners,
  uniqueListeners: s.uniqueListeners,
  reactionCount: s.reactionCount,
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = { host: req.userId };
    const [items, total] = await Promise.all([
      Session.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Session.countDocuments(filter),
    ]);
    res.json({ items: items.map(toDto), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const host = new mongoose.Types.ObjectId(req.userId);
    const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);
    // Per-host session counts are small, so totals and daily buckets are computed in one lean query.
    const all = await Session.find({ host }).select("startedAt uniqueListeners liveSeconds peakListeners reactionCount").lean();
    const daily = all.filter((s) => s.startedAt >= since);
    const sum = (k) => all.reduce((n, s) => n + (s[k] || 0), 0);
    // Fill gaps so the chart always has 14 continuous days.
    const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const byDay = new Map();
    for (const s of daily) {
      const k = dayKey(s.startedAt);
      const cur = byDay.get(k) || { sessions: 0, listeners: 0 };
      byDay.set(k, { sessions: cur.sessions + 1, listeners: cur.listeners + (s.uniqueListeners || 0) });
    }
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = dayKey(d);
      const hit = byDay.get(key);
      days.push({ date: key, sessions: hit?.sessions || 0, listeners: hit?.listeners || 0 });
    }
    res.json({
      totals: {
        sessions: all.length,
        listeners: sum("uniqueListeners"),
        liveSeconds: Math.round(sum("liveSeconds")),
        peakListeners: all.reduce((m, s) => Math.max(m, s.peakListeners || 0), 0),
        reactions: sum("reactionCount"),
      },
      days,
    });
  } catch (e) {
    next(e);
  }
});

async function ownedSession(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, "Invalid session id.", "VALIDATION");
  const s = await Session.findById(req.params.id);
  if (!s) throw new AppError(404, "Session not found.", "NOT_FOUND");
  if (s.host.toString() !== req.userId) throw new AppError(403, "You don't have access to this session.", "FORBIDDEN");
  return s;
}

router.get("/:id", async (req, res, next) => {
  try {
    res.json({ session: toDto(await ownedSession(req)) });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const s = await ownedSession(req);
    if (s.status === "active") throw new AppError(409, "End the room before deleting its history.", "INVALID_STATE");
    await s.deleteOne();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
