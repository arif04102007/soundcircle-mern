const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { corsOrigin, config } = require("./config");
const { notFound, errorHandler } = require("./middleware/error");

function createApp() {
  const app = express();
  if (config.isProd) app.set("trust proxy", 1); // Render / Railway sit behind a proxy
  app.use(helmet());
  app.use(cors({ origin: corsOrigin() }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/", (_req, res) => res.json({ name: "SoundCircle API", status: "ok" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/sessions", require("./routes/sessions"));
  app.use("/api", require("./routes/rooms"));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
