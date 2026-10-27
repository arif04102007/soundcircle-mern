import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Headphones, Mic2, Radio, Zap, Shield, Globe,
  ChevronRight, Check, Music,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { savedName } from "../lib/format";

/* Pre-generated so heights are stable across renders */
const WAVE_BARS = Array.from({ length: 52 }, (_, i) => ({
  pct: 12 + Math.abs(Math.sin(i * 0.38) * 72),
  dur: (0.6 + (i % 7) * 0.12).toFixed(2),
  delay: (i * 0.055).toFixed(2),
}));

const FEATURES = [
  { icon: Zap,    title: "Real-time WebRTC",    desc: "Sub-second latency, peer-to-peer. Your audio never touches a recording server." },
  { icon: Globe,  title: "No app to install",   desc: "Listeners join on any phone or laptop by opening a link. Works in every modern browser." },
  { icon: Shield, title: "Private by design",   desc: "Rooms are ephemeral, codes are 4 digits, nothing is recorded. Disappears when you end it." },
  { icon: Mic2,   title: "Tab or microphone",   desc: "Stream any Chrome/Edge tab — movies, Spotify, games — or go live with your microphone." },
  { icon: Radio,  title: "Live analytics",      desc: "Watch listener count in real time, see reactions fly in, and browse full session history." },
  { icon: Music,  title: "Music-grade Opus",    desc: "Stereo Opus at 192 kbps. Noticeably better than a phone call — clear enough for music." },
];

const STEPS = [
  { n: "01", title: "Open a room",       body: "Sign into your studio on the laptop playing the audio. Name your room and press Open." },
  { n: "02", title: "Share the code",    body: "You get a 4-digit code. Share it verbally, in a chat, or let people scan the QR code." },
  { n: "03", title: "Everyone tunes in", body: "Friends open SoundCircle on their phone, type the code, plug in headphones — they're live." },
];

const PLANS = [
  {
    name: "Free", price: "₹0", desc: "Perfect for casual sessions",
    features: ["Unlimited rooms", "Up to 20 listeners", "4-digit room codes", "QR code sharing", "Session history", "Basic analytics"],
    cta: "Get started free", highlight: false,
  },
  {
    name: "Pro", price: "₹299", period: "/mo", desc: "For serious broadcasters",
    features: ["Everything in Free", "Unlimited listeners", "Custom room names", "Full session history", "Advanced analytics", "Priority TURN relay", "Early access features"],
    cta: "Coming soon", highlight: true,
  },
];

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState(savedName());
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) return setErr("Room codes are exactly 4 digits.");
    if (name.trim()) localStorage.setItem("sc_name", name.trim());
    nav(`/room/${code}`, { state: { name: name.trim() } });
  };

  return (
    <main className="w-full overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center">
        {/* Waveform bg */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center" aria-hidden>
          <div className="flex h-3/4 w-full items-end gap-[3px] px-1 opacity-[0.06]">
            {WAVE_BARS.map((b, i) => (
              <span key={i} className="wave-bar flex-1 rounded-t-sm bg-lavender"
                style={{ height: `${b.pct}%`, animation: `wave-rise ${b.dur}s ease-in-out ${b.delay}s infinite alternate` }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,transparent_30%,#080808_80%)]" />
        </div>
        {/* Top glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lavender/10 blur-3xl" aria-hidden />

        <div className="relative mb-7 inline-flex items-center gap-2 rounded-full border border-lavender/30 bg-lavender/10 px-4 py-1.5 text-sm font-medium text-lavender">
          <span className="h-2 w-2 animate-pulse rounded-full bg-lavender" aria-hidden />
          Real-time audio · No app needed · WebRTC
        </div>

        <h1 className="relative max-w-4xl font-display text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.92] tracking-tight">
          <span className="gradient-text">Turn one laptop</span>
          <br />
          <span className="text-white">into everyone's headphones.</span>
        </h1>

        <p className="relative mt-7 max-w-2xl text-lg leading-relaxed text-white/55">
          Stream audio from any browser tab — a movie, Spotify, a game — live to every phone in the room.
          <br className="hidden sm:block" /> No cables. No apps. Just a 4-digit code.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to={user ? "/studio" : "/auth"}
            className="group inline-flex items-center gap-2 rounded-full bg-lavender px-8 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(166,107,255,0.3)] transition-all hover:bg-lavender-hi hover:shadow-[0_0_45px_rgba(166,107,255,0.5)]">
            {user ? "Go to Studio" : "Start hosting free"}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <a href="#join"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white/75 transition-all hover:border-lavender/40 hover:text-white">
            <Headphones className="h-4 w-4" aria-hidden /> I have a code
          </a>
        </div>

        <div className="relative mt-14 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-white/35">
          {["Free forever for listeners", "Works on any phone", "No download required"].map((s) => (
            <span key={s} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-lavender" aria-hidden />{s}
            </span>
          ))}
        </div>
      </section>

      {/* ── Join Form ── */}
      <section id="join" className="mx-auto max-w-md scroll-mt-6 px-5 pb-28">
        <form onSubmit={submit} className="rounded-3xl border border-white/8 bg-char p-7 shadow-2xl shadow-lavender/5" noValidate>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender/15">
              <Headphones className="h-5 w-5 text-lavender" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">Join a room</p>
              <p className="text-xs text-white/45">Type the 4-digit code from your host</p>
            </div>
          </div>
          <input id="code" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="0000" value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }}
            className="num mt-2 w-full rounded-2xl border border-white/12 bg-raised py-4 text-center text-6xl tracking-[0.3em] text-white placeholder:text-white/12 transition-all focus:border-lavender/50 focus:shadow-[0_0_0_3px_rgba(166,107,255,0.12)] focus:outline-none"
            aria-invalid={!!err} aria-describedby="code-err" />
          <p id="code-err" role="alert" className="mt-2 min-h-5 text-sm text-rose">{err}</p>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm text-white/55">Your name (shown to host, optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Guest"
              className="w-full rounded-xl border border-white/12 bg-raised px-4 py-3 text-white placeholder:text-white/25 transition-colors focus:border-lavender/45 focus:outline-none" />
          </label>
          <button type="submit" className="mt-5 w-full rounded-full bg-white py-4 text-base font-semibold text-void transition-all hover:bg-white/90 hover:shadow-[0_4px_24px_rgba(255,255,255,0.18)]">
            Tune in →
          </button>
        </form>
      </section>

      {/* ── How it Works ── */}
      <section className="border-t border-white/6 bg-char/50 py-24 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-lavender">How it works</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-black">Three steps. That's it.</h2>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ n, title, body }) => (
              <li key={n} className="group rounded-3xl border border-white/6 bg-char p-8 transition-all duration-300 hover:border-lavender/30 hover:shadow-[0_0_40px_rgba(166,107,255,0.07)]">
                <span className="num block text-6xl font-black text-lavender/20 transition-colors group-hover:text-lavender/50">{n}</span>
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-relaxed text-white/50">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-lavender">Why SoundCircle</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-black">Built for the moment.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">No sign-up friction. No app store. No pairing. Open a room and the audio flows.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="group rounded-3xl border border-white/6 bg-char p-6 transition-all duration-300 hover:border-lavender/25 hover:bg-raised/60">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender/10 transition-colors group-hover:bg-lavender/18">
                  <Icon className="h-6 w-6 text-lavender" aria-hidden />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="border-t border-white/6 py-16 px-5">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-white/30">Built with</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {["MongoDB", "Express.js", "React 18", "Node.js", "Socket.io", "WebRTC", "Tailwind CSS v4", "Vite"].map((t) => (
              <span key={t} className="rounded-full border border-white/8 bg-char px-4 py-2 text-sm font-medium text-white/45 transition-all hover:border-lavender/30 hover:text-lavender">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-5">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-lavender">Pricing</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-black">Simple &amp; honest.</h2>
            <p className="mt-3 text-white/45">No hidden fees. Listeners are always free.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-3xl border p-8 ${plan.highlight ? "border-lavender/45 bg-lavender/8 shadow-[0_0_60px_rgba(166,107,255,0.1)]" : "border-white/8 bg-char"}`}>
                {plan.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-lavender px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(166,107,255,0.4)]">
                    Coming soon
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-white/35">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="num text-5xl font-black">{plan.price}</span>
                  {plan.period && <span className="text-white/40">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-white/45">{plan.desc}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-lavender" : "text-white/30"}`} aria-hidden />
                      <span className={plan.highlight ? "text-white/75" : "text-white/55"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button disabled={plan.highlight} onClick={() => !plan.highlight && nav(user ? "/studio" : "/auth")}
                  className={`mt-8 w-full rounded-full py-3.5 text-sm font-semibold transition-all ${plan.highlight ? "cursor-not-allowed bg-lavender/15 text-lavender/50" : "bg-white text-void hover:bg-white/90 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]"}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-lavender/20 bg-char p-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(166,107,255,0.12),transparent)]" aria-hidden />
          <h2 className="relative font-display text-[clamp(2rem,5vw,3.5rem)] font-black">Start broadcasting in 30 seconds.</h2>
          <p className="relative mt-4 text-white/50">Free to host. Free to listen. No download required.</p>
          <Link to={user ? "/studio" : "/auth"}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-lavender px-8 py-4 font-semibold text-white shadow-[0_0_30px_rgba(166,107,255,0.35)] transition-all hover:bg-lavender-hi hover:shadow-[0_0_50px_rgba(166,107,255,0.5)]">
            {user ? "Open your studio" : "Create your free account"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

    </main>
  );
}

