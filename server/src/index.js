const http = require("http");
const mongoose = require("mongoose");
const { config, assertConfig } = require("./config");
const { createApp } = require("./app");
const { initSockets } = require("./sockets");
const Session = require("./models/Session");

async function main() {
  assertConfig();
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10_000 });
  console.log("MongoDB connected");

  // Rooms live in memory, so anything still "active" in the DB belongs to a previous process.
  const { modifiedCount } = await Session.updateMany(
    { status: "active" },
    { status: "interrupted", endReason: "server_restart", endedAt: new Date() }
  );
  if (modifiedCount) console.log(`Marked ${modifiedCount} orphaned session(s) as interrupted`);

  const server = http.createServer(createApp());
  const io = initSockets(server);
  server.listen(config.port, () => console.log(`SoundCircle server listening on :${config.port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, closing rooms…`);
    await io.closeAllRooms();
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
