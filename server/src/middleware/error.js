const { ZodError } = require("zod");

const notFound = (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}`, code: "NOT_FOUND" });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return res.status(400).json({ error: details[0]?.message || "Invalid input.", code: "VALIDATION", details });
  }
  if (err?.code === 11000) return res.status(409).json({ error: "That email is already registered.", code: "DUPLICATE" });
  if (err?.name === "CastError") return res.status(400).json({ error: "Invalid id.", code: "VALIDATION" });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON body.", code: "VALIDATION" });
  if (err.status) return res.status(err.status).json({ error: err.message, code: err.code });
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again.", code: "INTERNAL" });
}

module.exports = { notFound, errorHandler };
