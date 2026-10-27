const mongoose = require("mongoose");

// One document per hosted room. Created when a room opens, finalised when it closes.
const sessionSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostName: { type: String, required: true },
    code: { type: String, required: true },
    title: { type: String, default: "Untitled room", maxlength: 60 },
    status: { type: String, enum: ["active", "ended", "interrupted"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    endReason: String,
    durationSec: { type: Number, default: 0 },
    liveSeconds: { type: Number, default: 0 },
    peakListeners: { type: Number, default: 0 },
    uniqueListeners: { type: Number, default: 0 },
    reactionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.index({ host: 1, startedAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
