import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Radio, Shield, Zap, Sparkles, ArrowLeft } from "lucide-react";
import { Button, Field, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dest = loc.state?.from || "/studio";

  if (user) return <Navigate to={dest} replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      nav(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:py-16">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-center">
        {/* Left Side: Value Proposition & Aesthetics */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/8 bg-char/60 p-10 relative overflow-hidden h-[540px]">
          <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-lavender/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-rose/15 blur-3xl" aria-hidden />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-lavender/30 bg-lavender/10 px-3.5 py-1 text-xs font-semibold text-lavender">
              <Sparkles className="h-3 w-3" /> Host Console
            </span>
            <h1 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight">
              Broadcast high-fidelity audio in seconds.
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Sign in to generate room codes, view real-time audience metrics, monitor latency, and maintain your broadcast history.
            </p>
          </div>

          <div className="relative space-y-4">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lavender/15 text-lavender">
                <Radio className="h-4 w-4" />
              </span>
              <span>Ultra low-latency WebRTC stereo transmission</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lavender/15 text-lavender">
                <Zap className="h-4 w-4" />
              </span>
              <span>Direct browser tab &amp; mic capture</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lavender/15 text-lavender">
                <Shield className="h-4 w-4" />
              </span>
              <span>Ephemeral sessions — no audio recorded on server</span>
            </div>
          </div>

          <div className="relative border-t border-white/10 pt-4 text-xs text-white/40">
            Listeners never need an account. Only hosts sign in to create and manage rooms.
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <Panel className="p-8 md:p-10 border-white/10 shadow-2xl relative">
          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-raised/80 p-1 border border-white/6 mb-8">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-lavender text-white shadow-[0_0_20px_rgba(166,107,255,0.3)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-lavender text-white shadow-[0_0_20px_rgba(166,107,255,0.3)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create your host account"}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {mode === "login" ? "Enter your credentials to access your studio" : "Get started with your free host account"}
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === "register" && (
              <Field
                label="Your Name or Studio Handle"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                maxLength={40}
                placeholder="e.g. Alex Rivera"
                required
              />
            )}
            <Field
              label="Email Address"
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@domain.com"
              required
            />

            <div className="relative">
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 p-1 text-white/40 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 p-3 text-sm text-rose">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={busy}
              className="w-full py-4 text-base mt-2 shadow-[0_0_30px_rgba(166,107,255,0.35)]"
            >
              {mode === "login" ? "Sign in to Studio →" : "Create Host Account →"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            By signing in, you agree to ephemeral session hosting terms.
          </p>
        </Panel>
      </div>
    </main>
  );
}

