const router = require("express").Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const User = require("../models/User");
const { signToken, requireAuth } = require("../middleware/auth");
const { AppError } = require("../utils/errors");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes.", code: "RATE_LIMITED" },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post("/register", limiter, async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    if (await User.exists({ email })) throw new AppError(409, "That email is already registered.", "DUPLICATE");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user.id), user: user.toPublic() });
  } catch (e) {
    next(e);
  }
});

router.post("/login", limiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select("+passwordHash");
    // One message for unknown email and wrong password so accounts can't be enumerated.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new AppError(401, "Incorrect email or password.", "BAD_CREDENTIALS");
    res.json({ token: signToken(user.id), user: user.toPublic() });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(401, "Account no longer exists.", "UNAUTHORIZED");
    res.json({ user: user.toPublic() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
