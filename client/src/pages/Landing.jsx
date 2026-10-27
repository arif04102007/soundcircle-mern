import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { savedName } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  ["Open a room", "Sign in on the laptop that's playing the music or the movie. You get a 4-digit code."],
  ["Share a tab's audio", "Press Go live and pick the tab. Everything it plays is sent over WebRTC to whoever is listening."],
  ["Everyone types the code", "Friends open soundcircle on their phone, enter the code and plug in headphones. No app, no cable."],
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
    <main className="mx-auto w-full max-w-6xl px-5">
      <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        <div>
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-[0.98] tracking-tight">
            Turn one laptop into everyone's headphones.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Stream a tab's audio live to every phone in the room. No app to install, no cables, no pairing. Just a 4-digit code.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to={user ? "/studio" : "/auth"} className="rounded-full bg-crimson px-7 py-3.5 text-sm font-semibold hover:bg-crimson-hi">
              {user ? "Open your studio" : "Host a room"}
            </Link>
            <span className="text-sm text-white/50">Hosting needs Chrome or Edge on a laptop. Listening works on any phone.</span>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-char p-7" noValidate>
          <label htmlFor="code" className="font-display text-2xl font-extrabold">Got a code?</label>
          <p className="mt-1 text-sm text-white/55">Type the 4 digits your host is showing.</p>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="0000"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }}
            className="num mt-5 w-full rounded-2xl border border-white/15 bg-forest py-4 text-center text-6xl tracking-[0.3em] text-white placeholder:text-white/15 focus:border-white/50 focus:outline-none"
            aria-invalid={!!err}
            aria-describedby="code-err"
          />
          <p id="code-err" role="alert" className="mt-2 min-h-5 text-sm text-[#ff8a86]">{err}</p>
          <label className="mt-2 block">
            <span className="mb-1.5 block text-sm text-white/60">Your name (shown to the host)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Optional"
              className="w-full rounded-xl border border-white/15 bg-forest px-4 py-3 text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none" />
          </label>
          <Button type="submit" variant="light" className="mt-5 w-full py-4 text-base">Tune in</Button>
        </form>
      </section>

      <section className="border-t border-white/10 py-16" aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-extrabold">How it works</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <span className="num text-5xl text-crimson-hi">{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-white/65">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
