const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { AppError } = require("../utils/errors");

const signToken = (userId) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret).sub;
  } catch {
    return null;
  }
}

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = token && verifyToken(token);
  if (!userId) return next(new AppError(401, "Please sign in to continue.", "UNAUTHORIZED"));
  req.userId = userId;
  next();
}

module.exports = { signToken, verifyToken, requireAuth };
