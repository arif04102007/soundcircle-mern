import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Headphones, Volume2, WifiOff, Radio, Sparkles } from "lucide-react";
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
    if (r.status === "connecting") return <Spinner label={`Connecting to room ${code}…`} />;
    if (r.status === "error" || r.status === "closed") {
      const closed = r.status === "closed";
      return (
        <Panel className="py-16 text-center p-8 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/10 text-lavender mb-4">
            <Radio className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-black">
            {closed ? "Session Ended" : r.error?.code === "NOT_FOUND" ? "Room Not Found" : "Connection Error"}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/55 leading-relaxed">
            {r.error?.message || "This broadcast is no longer active."}
          </p>
          <Button variant="primary" className="mt-8 px-8 py-3.5" onClick={() => nav("/")}>
            {closed ? "Back to Home" : "Try Another Code"}
          </Button>
        </Panel>
      );
    }
    const waiting = !r.live;
    return (
      <Panel className="relative overflow-hidden p-8 shadow-2xl border-white/10">
        <Floaters items={r.reactions} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-lavender bg-lavender/10 px-2.5 py-0.5 rounded-md border border-lavender/20">
              Room {code}
            </span>
            <h1 className="break-words font-display text-2xl md:text-3xl font-black leading-tight tracking-tight mt-2 text-white">
              {r.room.title}
            </h1>
            <p className="text-xs text-white/50 mt-1">Hosted by <b className="text-white/80">{r.room.hostName}</b></p>
          </div>
          <OnAir live={r.live && r.hostOnline} label={!r.hostOnline ? "Host Away" : r.live ? "LIVE" : "STANDBY"} />
        </div>

        {!r.hostOnline && (
          <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden /> Host momentarily disconnected. Holding room for 30 seconds…
          </p>
        )}

        {/* Audio Visualizer Box */}
        <div className="relative mt-6 rounded-2xl border border-white/8 bg-raised/80 p-5 overflow-hidden">
          <Meter stream={r.stream} active={r.live && r.conn === "connected"} bars={26} />
          {r.blocked && (
            <button
              onClick={r.play}
              className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-lavender text-white font-bold text-base shadow-[0_0_30px_rgba(166,107,255,0.7)] animate-pulse"
            >
              <Headphones className="h-5 w-5" aria-hidden /> Tap to unmute audio
            </button>
          )}
        </div>

        <p role="status" className="mt-4 text-center text-xs text-white/50 min-h-5 flex items-center justify-center gap-2">
          {waiting ? (
            <span>Waiting for the host to start broadcasting…</span>
          ) : r.conn === "connected" ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Streaming live audio
            </span>
          ) : r.conn === "reconnecting" ? (
            <span className="text-amber-400">Reconnecting audio stream…</span>
          ) : (
            <span className="text-lavender">Establishing WebRTC audio connection…</span>
          )}
        </p>

        {/* Volume Slider */}
        <label className="mt-6 block rounded-2xl border border-white/6 bg-raised/40 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/70">
            <span className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-lavender" aria-hidden /> Volume
            </span>
            <span className="font-mono text-sm text-lavender font-bold">{r.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={r.volume}
            onChange={(e) => r.setVolume(Number(e.target.value))}
            className="w-full accent-[#A66BFF] cursor-pointer"
          />
        </label>

        {/* Reactions */}
        <div className="mt-6" role="group" aria-label="Send a reaction">
          <p className="text-xs text-white/40 mb-2 font-medium">React live</p>
          <div className="flex justify-between gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => r.react(e)}
                aria-label={`React ${e}`}
                className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-white/8 bg-raised text-2xl transition-all duration-200 hover:border-lavender/40 hover:bg-lavender/15 hover:scale-110 active:scale-95"
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-7 flex items-center justify-between border-t border-white/8 pt-5 text-xs text-white/45">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lavender" />
            <b>{r.count}</b> in audience {r.rtt != null && `· ${r.rtt}ms latency`}
          </span>
          <Button variant="ghost" onClick={() => nav("/")} className="px-4 py-1.5 text-xs text-white/50 hover:text-white">
            Leave Room
          </Button>
        </div>
      </Panel>
    );
  })();

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-20 pt-8">
      <audio ref={audioRef} autoPlay playsInline />
      {body}
    </main>
  );
}

