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
    <main className="mx-auto w-full max-w-6xl px-5 pb-16">
      {!h.online && (
        <div role="alert" className="mb-5 flex items-center gap-3 rounded-2xl bg-crimson px-5 py-3 text-sm font-semibold">
          <WifiOff className="h-4 w-4" aria-hidden /> Connection lost. Reconnecting… your room stays open for 30 seconds.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/50">Host console</p>
          <h1 className="font-display text-3xl font-black tracking-tight">{h.room.title}</h1>
        </div>
        <OnAir live={h.live} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="relative overflow-hidden">
          <Floaters items={h.reactions} />
          <p className="text-sm text-white/55">Room code. Listeners type this at soundcircle.</p>
          <div className="mt-3 flex gap-2 sm:gap-3" aria-label={`Room code ${h.room.code.split("").join(" ")}`}>
            {h.room.code.split("").map((d, i) => (
              <div key={i} className={`num flex aspect-[3/4] flex-1 items-center justify-center rounded-2xl border bg-forest text-[clamp(3.5rem,11vw,7rem)] leading-none ${h.live ? "border-crimson" : "border-white/10"}`}>{d}</div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Link copied" : "Copy join link"}</Button>
            <Button variant="outline" onClick={() => setQr((v) => !v)}><QrCode className="h-4 w-4" />{qr ? "Hide QR" : "Show QR"}</Button>
          </div>
          {qr && (
            <div className="mt-4 inline-block rounded-2xl bg-white p-4">
              <QRCodeSVG value={link} size={168} />
            </div>
          )}

          <div className="mt-6"><Meter stream={h.stream} active={h.live} /></div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {h.live ? (
              <Button variant="light" onClick={h.stopLive} className="px-8 py-4">Stop broadcast</Button>
            ) : (
              <Button onClick={() => go("tab")} loading={starting} className="px-8 py-4">Go live</Button>
            )}
            {!h.live && <Button variant="ghost" onClick={() => go("mic")}><Mic className="h-4 w-4" />Use microphone instead</Button>}
            <Button variant="ghost" onClick={end} className="ml-auto">End room</Button>
          </div>
          {captureError && <p role="alert" className="mt-4 rounded-xl border border-crimson bg-crimson/15 p-4 text-sm leading-relaxed">{captureError}</p>}
          {!h.live && !captureError && (
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Press Go live, choose the browser tab that's playing audio and tick <b className="text-white/80">“Also share tab audio”</b>. Only the audio is sent, never your screen.
            </p>
          )}
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold">Listeners</h2>
            <span className="num text-3xl">{h.listeners.length}</span>
          </div>
          {h.listeners.length === 0 ? (
            <p className="mt-6 text-white/50">Nobody yet. Share code <b className="num text-white">{h.room.code}</b> or the QR code.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {h.listeners.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.conn === "connected" ? "bg-white" : "border border-white/40"}`} aria-hidden />
                    <span className="truncate font-medium">{l.name}</span>
                  </span>
                  <span className="shrink-0 text-sm text-white/50">
                    {h.live ? (l.conn === "connected" ? "listening" : l.conn === "failed" ? "retrying" : "connecting…") : "waiting"}
                    {l.rtt != null && ` · ${l.rtt} ms`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/40">The ms figure is each listener's round-trip time to the server, a rough guide to who might hear a delay.</p>
        </Panel>
      </div>
    </main>
  );
}
