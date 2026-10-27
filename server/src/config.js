require("dotenv").config();

const origins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const config = {
  port: Number(process.env.PORT) || 3001,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigins: origins,
  turn: {
    urls: (process.env.TURN_URLS || "").split(",").map((s) => s.trim()).filter(Boolean),
    username: process.env.TURN_USERNAME || "",
    credential: process.env.TURN_CREDENTIAL || "",
  },
  hostGraceMs: Number(process.env.HOST_GRACE_MS) || 30_000,
  staleRoomMs: 3 * 60 * 60 * 1000,
};

function assertConfig() {
  const missing = ["mongoUri", "jwtSecret"].filter((k) => !config[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  if (config.isProd && config.jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
}

// empty list = allow any origin (local development only)
const corsOrigin = () => (config.clientOrigins.length ? config.clientOrigins : true);

module.exports = { config, assertConfig, corsOrigin };
