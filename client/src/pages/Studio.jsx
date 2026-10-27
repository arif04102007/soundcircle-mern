import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Trash2, Radio, Users, Clock, Flame, Calendar, Sparkles } from "lucide-react";
import { Button, OnAir, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/Toast";
import { api } from "../lib/api";
import { END_REASONS, formatDate, formatDuration } from "../lib/format";

function Stat({ label, value, icon: Icon, color = "lavender" }) {
  const isRose = color === "rose";
  return (
    <div className="group rounded-3xl border border-white/8 bg-char p-6 transition-all duration-300 hover:border-lavender/30 hover:bg-raised/70">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/50">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isRose ? "bg-rose/15 text-rose" : "bg-lavender/15 text-lavender"}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="num mt-4 text-4xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function DailyChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.listeners));
  const empty = days.every((d) => d.listeners === 0);
  return (
    <Panel className="p-7">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-lavender" />
          <h2 className="font-display text-xl font-extrabold">Listeners (Last 14 Days)</h2>
        </div>
        {empty && <span className="text-xs text-white/40">No broadcasts recorded yet</span>}
      </div>
      <div className="mt-8 flex h-36 items-end gap-2" role="img" aria-label="Bar chart of listeners per day for the last 14 days">
        {days.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.listeners} listeners in ${d.sessions} session(s)`}>
            <div
              className={`w-full rounded-t-md transition-all duration-300 ${
                d.listeners
                  ? "bg-gradient-to-t from-lavender to-rose shadow-[0_0_12px_rgba(166,107,255,0.4)] group-hover:brightness-125"
                  : "bg-white/8 hover:bg-white/15"
              }`}
              style={{ height: `${d.listeners ? Math.max(10, (d.listeners / max) * 100) : 4}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-white/40">
        <span>{days[0].date.slice(5)}</span>
        <span className="text-white/20">Daily Activity</span>
        <span>{days[days.length - 1].date.slice(5)}</span>
      </div>
    </Panel>
  );
}

export default function Studio() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [stats, setStats] = useState(null);
  const [list, setList] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, l] = await Promise.all([api("/sessions/stats"), api(`/sessions?page=${page}&limit=8`)]);
      setStats(s);
      setList(l);
    } catch (e) {
      setError(e.message);
    }
  }, [page]);
  useEffect(() => { load(); }, [load]);

  const open = list?.items.find((s) => s.status === "active");
  const start = (e) => { e.preventDefault(); nav("/studio/room", { state: { title: title.trim() } }); };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}" from your history?`)) return;
    try { await api(`/sessions/${s.id}`, { method: "DELETE" }); toast("Session deleted"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lavender">
            <Sparkles className="h-3.5 w-3.5" /> Host Control Center
          </span>
          <h1 className="mt-1 font-display text-4xl font-black tracking-tight">Studio Dashboard</h1>
          <p className="mt-1 text-sm text-white/55">Logged in as {user.name} ({user.email})</p>
        </div>
      </div>

      {open && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-rose/30 bg-gradient-to-r from-rose/15 via-char to-char p-6 shadow-[0_0_40px_rgba(255,45,149,0.15)]">
          <div className="flex items-center gap-4">
            <OnAir live label="LIVE NOW" />
            <div>
              <span className="font-bold text-lg">“{open.title}”</span>
              <span className="ml-3 font-mono text-sm text-lavender bg-lavender/10 px-2.5 py-1 rounded-lg border border-lavender/20">
                Code {open.code}
              </span>
            </div>
          </div>
          <Button variant="rose" onClick={() => nav("/studio/room")} className="px-6 py-3">
            Return to console <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}

      {/* Start Broadcast Form */}
      <form onSubmit={start} className="mt-8 flex flex-col gap-4 rounded-3xl border border-white/8 bg-char p-6 sm:flex-row sm:items-end shadow-xl">
        <label className="flex-1">
          <span className="mb-2 block text-sm font-semibold text-white/70">Start a new broadcast</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="Room title (e.g. Friday DJ Set, Movie Watchparty)"
            disabled={!!open}
            className="w-full rounded-2xl border border-white/12 bg-raised px-4 py-3.5 text-white placeholder:text-white/25 focus:border-lavender/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(166,107,255,0.12)] disabled:opacity-40"
          />
        </label>
        <Button
          type="submit"
          disabled={!!open}
          className="py-4 px-8 text-base shadow-[0_0_25px_rgba(166,107,255,0.35)]"
        >
          Open Room →
        </Button>
      </form>

      {error ? (
        <Panel className="mt-8 text-center p-8">
          <p className="text-rose font-medium">{error}</p>
          <Button variant="outline" onClick={load} className="mt-4">Try again</Button>
        </Panel>
      ) : !stats || !list ? (
        <div className="mt-8 space-y-4" role="status" aria-label="Loading your history">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
          <div className="skeleton h-56" /><div className="skeleton h-64" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Rooms Hosted" value={stats.totals.sessions} icon={Radio} color="lavender" />
            <Stat label="Total Listeners" value={stats.totals.listeners} icon={Users} color="rose" />
            <Stat label="Broadcast Time" value={formatDuration(stats.totals.liveSeconds)} icon={Clock} color="lavender" />
            <Stat label="Peak Crowd" value={stats.totals.peakListeners} icon={Flame} color="rose" />
          </div>

          <div className="mt-6"><DailyChart days={stats.days} /></div>

          <div className="mt-12 flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold">Broadcast History</h2>
            <span className="text-xs text-white/40">{list.total} total sessions</span>
          </div>

          {list.items.length === 0 ? (
            <Panel className="mt-4 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/10 text-lavender mb-3">
                <Radio className="h-7 w-7" />
              </span>
              <p className="font-display text-2xl font-extrabold">No broadcasts yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
                Open your first room above. When you end it, audience counts, duration, and metrics will be archived here.
              </p>
            </Panel>
          ) : (
            <ul className="mt-4 divide-y divide-white/6 overflow-hidden rounded-3xl border border-white/8 bg-char shadow-xl">
              {list.items.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4.5 hover:bg-raised/40 transition-colors">
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="truncate font-semibold text-white">{s.title}</div>
                    <div className="text-xs text-white/45 mt-0.5">{formatDate(s.startedAt)} · <span className="font-mono text-lavender/80">code {s.code}</span></div>
                  </div>
                  <div className="text-xs text-white/65">
                    <span className="text-white font-medium">{formatDuration(s.liveSeconds)}</span> live / {formatDuration(s.durationSec)}
                  </div>
                  <div className="text-xs text-white/65">
                    <span className="text-white font-medium">{s.uniqueListeners}</span> listener{s.uniqueListeners === 1 ? "" : "s"} · peak {s.peakListeners}
                  </div>
                  <div className="w-32">
                    {s.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/15 border border-rose/30 px-2.5 py-0.5 text-xs font-semibold text-rose">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose animate-ping" /> Live now
                      </span>
                    ) : (
                      <span className="text-xs text-white/40">
                        {END_REASONS[s.endReason] || "Completed"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => remove(s)}
                    disabled={s.status === "active"}
                    aria-label={`Delete ${s.title}`}
                    className="rounded-xl p-2 text-white/30 hover:bg-rose/10 hover:text-rose disabled:opacity-20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {list.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-5 py-2">
                Newer
              </Button>
              <span className="text-xs text-white/50">Page {page} of {list.pages}</span>
              <Button variant="outline" disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)} className="px-5 py-2">
                Older
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

