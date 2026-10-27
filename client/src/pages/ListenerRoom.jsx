import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Headphones, Volume2, WifiOff } from "lucide-react";
import Floaters from "../components/Floaters";
import Meter from "../components/Meter";
import { Button, OnAir, Panel, Spinner } from "../components/ui";
import { useListenerRoom } from "../hooks/useListenerRoom";
import { randomGuestName, savedName } from "../lib/format";

const EMOJIS = ["🔥", "❤️", "😂", "👏", "🎵"];

export default function ListenerRoom() {
  const { code } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const audioRef = useRef(null);
  const [name] = useState(() => loc.state?.name || savedName() || randomGuestName());
  const r = useListenerRoom({ code, name, audioRef });

  const body = (() => {
    if (r.status === "connecting") return <Spinner label={`Joining room ${code}…`} />;
    if (r.status === "error" || r.status === "closed") {
      const closed = r.status === "closed";
      return (
        <Panel className="py-12 text-center">
          <h1 className="font-display text-3xl font-black">{closed ? "Session ended" : r.error?.code === "NOT_FOUND" ? "No room with that code" : "Couldn't join"}</h1>
          <p className="mx-auto mt-3 max-w-xs text-white/60">{r.error?.message}</p>
          <Button variant="light" className="mt-8" onClick={() => nav("/")}>{closed ? "Back home" : "Try another code"}</Button>
        </Panel>
      );
    }
    const waiting = !r.live;
    return (
      <Panel className="relative overflow-hidden p-7">
        <Floaters items={r.reactions} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white/50">Room {code}</p>
            <h1 className="break-words font-display text-3xl font-black leading-tight tracking-tight">{r.room.title}</h1>
            <p className="text-sm text-white/55">Hosted by {r.room.hostName}</p>
          </div>
          <OnAir live={r.live && r.hostOnline} label={!r.hostOnline ? "Host away" : r.live ? "On air" : "Standby"} />
        </div>

        {!r.hostOnline && (
          <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm"><WifiOff className="h-4 w-4 shrink-0" aria-hidden />The host lost connection. Waiting up to 30 seconds for them to return…</p>
        )}

        <div className="relative mt-6">
          <Meter stream={r.stream} active={r.live && r.conn === "connected"} bars={24} />
          {r.blocked && (
            <button onClick={r.play} className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-crimson text-base font-bold">
              <Headphones className="h-5 w-5" aria-hidden /> Tap to start audio
            </button>
          )}
        </div>
        <p role="status" className="mt-3 min-h-6 text-center text-sm text-white/60">
          {waiting ? "Waiting for the host to go live…" : r.conn === "connected" ? "Listening live" : r.conn === "reconnecting" ? "Reconnecting audio…" : "Connecting audio…"}
        </p>

        <label className="mt-6 block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-white/70">
            <span className="flex items-center gap-2"><Volume2 className="h-4 w-4" aria-hidden />Volume</span><span className="num text-base">{r.volume}</span>
          </span>
          <input type="range" min="0" max="100" value={r.volume} onChange={(e) => r.setVolume(Number(e.target.value))} className="w-full accent-[#a31c1b]" />
        </label>

        <div className="mt-6 flex justify-between" role="group" aria-label="Send a reaction">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => r.react(e)} aria-label={`React ${e}`} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-forest text-2xl transition-transform hover:bg-white/10 active:scale-90">{e}</button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-white/50">
          <span>{r.count} listening{r.rtt != null && ` · ${r.rtt} ms`}</span>
          <Button variant="outline" onClick={() => nav("/")} className="px-5 py-2">Leave</Button>
        </div>
      </Panel>
    );
  })();

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16">
      <audio ref={audioRef} autoPlay playsInline />
      {body}
    </main>
  );
}
