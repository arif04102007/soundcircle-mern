import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Mic, QrCode, WifiOff } from "lucide-react";
import Floaters from "../components/Floaters";
import Meter from "../components/Meter";
import { Button, OnAir, Panel, Spinner } from "../components/ui";
import { useHostRoom } from "../hooks/useHostRoom";
import { useToast } from "../context/Toast";

export default function HostRoom() {
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const h = useHostRoom({ title: loc.state?.title });
  const [captureError, setCaptureError] = useState("");
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);

  if (h.status === "connecting") return <Spinner label="Opening your room…" />;
  if (h.status !== "ready") {
    const msg = {
      error: h.error,
      ended: "Your room is closed and the session was saved to your history.",
      taken_over: "This room was opened in another tab, so this one has been disconnected.",
    }[h.status];
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-black">{h.status === "ended" ? "Room closed" : h.status === "taken_over" ? "Moved to another tab" : "Couldn't open the room"}</h1>
        <p className="mt-4 text-white/65">{msg}</p>
        <Button variant="light" className="mt-8" onClick={() => nav(h.status === "error" && /sign in/i.test(h.error) ? "/auth" : "/studio")}>
          {h.status === "error" && /sign in/i.test(h.error) ? "Sign in" : "Back to studio"}
        </Button>
      </main>
    );
  }

  const link = `${window.location.origin}/room/${h.room.code}`;
  const go = async (source) => {
    setCaptureError("");
    setStarting(true);
    const r = await h.startLive(source);
    setStarting(false);
    if (!r.ok) setCaptureError(r.error);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast("Couldn't copy. Select the link and copy it manually.", "error"); }
  };
  const end = () => { if (!h.listeners.length || window.confirm(`End the room? ${h.listeners.length} listener(s) will be disconnected.`)) h.endRoom(); };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6">
      {!h.online && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-rose/40 bg-rose/15 px-5 py-3 text-sm font-semibold text-rose">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden /> Connection lost. Reconnecting… your room stays open for 30 seconds.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lavender">Host Console</p>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight mt-1">{h.room.title}</h1>
        </div>
        <OnAir live={h.live} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="relative overflow-hidden p-8 shadow-2xl">
          <Floaters items={h.reactions} />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Room Passcode</span>
            <span className="text-xs text-lavender/80">Share this 4-digit code with your listeners</span>
          </div>

          <div className="mt-4 flex gap-2.5 sm:gap-4" aria-label={`Room code ${h.room.code.split("").join(" ")}`}>
            {h.room.code.split("").map((d, i) => (
              <div
                key={`digit-${i}`}
                className={`num flex aspect-[3/4] flex-1 items-center justify-center rounded-2xl border text-[clamp(3.5rem,11vw,6.5rem)] leading-none transition-all duration-300 ${
                  h.live
                    ? "border-lavender/60 bg-raised text-white shadow-[0_0_25px_rgba(166,107,255,0.25)] glow-lavender"
                    : "border-white/10 bg-raised/60 text-white/90"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              onClick={copy}
              className="text-xs py-2 px-4"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-lavender" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Link copied" : "Copy direct join link"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setQr((v) => !v)}
              className="text-xs py-2 px-4"
            >
              <QrCode className="h-3.5 w-3.5" />
              {qr ? "Hide QR" : "Show QR Code"}
            </Button>
          </div>

          {qr && (
            <div className="mt-5 inline-block rounded-3xl border border-white/10 bg-white p-5 shadow-2xl">
              <QRCodeSVG value={link} size={168} />
              <p className="mt-2 text-center font-mono text-xs text-char font-bold">Code: {h.room.code}</p>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/6 bg-raised/50 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/40">
              <span>AUDIO SIGNAL MONITOR</span>
              <span className={h.live ? "text-lavender font-semibold" : ""}>{h.live ? "LIVE TRANSMITTING" : "IDLE"}</span>
            </div>
            <Meter stream={h.stream} active={h.live} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {h.live ? (
              <Button
                variant="danger"
                onClick={h.stopLive}
                className="px-8 py-4 text-base shadow-[0_0_25px_rgba(163,28,27,0.4)]"
              >
                Stop broadcast
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => go("tab")}
                loading={starting}
                className="px-8 py-4 text-base shadow-[0_0_30px_rgba(166,107,255,0.4)] hover:shadow-[0_0_45px_rgba(166,107,255,0.6)]"
              >
                Go live (Share Tab Audio) →
              </Button>
            )}
            {!h.live && (
              <Button
                variant="outline"
                onClick={() => go("mic")}
                className="text-xs py-3.5 px-5"
              >
                <Mic className="h-4 w-4 text-lavender" /> Microphone only
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={end}
              className="ml-auto text-xs text-white/40 hover:text-rose hover:bg-rose/10"
            >
              End Room
            </Button>
          </div>

          {captureError && (
            <p role="alert" className="mt-5 rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose leading-relaxed">
              {captureError}
            </p>
          )}

          {!h.live && !captureError && (
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              💡 Tip: Click <b className="text-white">Go live</b>, select the browser tab (YouTube, Spotify, etc.) and ensure <b className="text-lavender">“Also share tab audio”</b> is ticked. Audio is streamed with zero video bandwidth.
            </p>
          )}
        </Panel>

        <Panel className="p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-white/8 pb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold">Active Audience</h2>
                <p className="text-xs text-white/40 mt-0.5">Real-time WebRTC listeners</p>
              </div>
              <span className="num text-4xl text-lavender font-black">{h.listeners.length}</span>
            </div>

            {h.listeners.length === 0 ? (
              <div className="mt-12 text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender/10 text-lavender mb-3">
                  <QrCode className="h-6 w-6" />
                </div>
                <p className="font-bold">No listeners connected yet</p>
                <p className="mt-1 text-xs text-white/50 max-w-xs mx-auto">
                  Share code <span className="font-mono text-lavender font-bold">{h.room.code}</span> or the direct join link with your friends.
                </p>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-white/6 max-h-[380px] overflow-y-auto pr-1">
                {h.listeners.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3.5">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lavender/15 text-xs font-bold text-lavender uppercase">
                        {l.name.slice(0, 2)}
                      </span>
                      <span className="truncate text-sm font-semibold text-white/90">{l.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-white/45 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          l.conn === "connected"
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                            : l.conn === "failed"
                            ? "bg-rose"
                            : "bg-amber-400 animate-pulse"
                        }`}
                        aria-hidden
                      />
                      <span>{h.live ? (l.conn === "connected" ? "Streaming" : "Connecting") : "Standing by"}</span>
                      {l.rtt != null && <span className="font-mono text-white/30">· {l.rtt}ms</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 border-t border-white/6 pt-4 text-xs text-white/35 leading-relaxed">
            The round-trip latency (ms) tracks connection health to ensure everyone hears in sync.
          </div>
        </Panel>
      </div>
    </main>
  );
}
