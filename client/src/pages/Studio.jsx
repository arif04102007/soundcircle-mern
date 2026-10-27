import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button, OnAir, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/Toast";
import { api } from "../lib/api";
import { END_REASONS, formatDate, formatDuration } from "../lib/format";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-char p-5">
      <div className="num text-4xl">{value}</div>
      <div className="mt-1 text-sm text-white/55">{label}</div>
    </div>
  );
}

function DailyChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.listeners));
  const empty = days.every((d) => d.listeners === 0);
  return (
    <Panel>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold">Listeners, last 14 days</h2>
        {empty && <span className="text-sm text-white/45">Nothing yet</span>}
      </div>
      <div className="mt-6 flex h-32 items-end gap-1.5" role="img" aria-label="Bar chart of listeners per day for the last 14 days">
        {days.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.listeners} listeners in ${d.sessions} session(s)`}>
            <div className={`w-full rounded-t-md ${d.listeners ? "bg-crimson-hi" : "bg-white/10"}`} style={{ height: `${d.listeners ? Math.max(8, (d.listeners / max) * 100) : 4}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/40"><span>{days[0].date.slice(5)}</span><span>{days[days.length - 1].date.slice(5)}</span></div>
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
    <main className="mx-auto w-full max-w-6xl px-5 pb-16">
      <h1 className="font-display text-4xl font-black tracking-tight">Studio</h1>
      <p className="mt-1 text-white/55">Welcome back, {user.name}.</p>

      {open && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-crimson p-5">
          <div className="flex items-center gap-3"><OnAir live label="Room open" /><span className="font-semibold">“{open.title}” · code <span className="num text-xl">{open.code}</span></span></div>
          <Button variant="light" onClick={() => nav("/studio/room")}>Return to console <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </div>
      )}

      <form onSubmit={start} className="mt-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-char p-6 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-white/70">Name your room (optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Friday movie night" disabled={!!open}
            className="w-full rounded-xl border border-white/15 bg-forest px-4 py-3 text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none disabled:opacity-40" />
        </label>
        <Button type="submit" disabled={!!open} className="py-3.5">Open a room</Button>
      </form>

      {error ? (
        <Panel className="mt-8 text-center">
          <p className="text-[#ff8a86]">{error}</p>
          <Button variant="outline" onClick={load} className="mt-4">Try again</Button>
        </Panel>
      ) : !stats || !list ? (
        <div className="mt-8 space-y-4" role="status" aria-label="Loading your history">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>
          <div className="skeleton h-52" /><div className="skeleton h-64" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Rooms hosted" value={stats.totals.sessions} />
            <Stat label="Listeners reached" value={stats.totals.listeners} />
            <Stat label="Time on air" value={formatDuration(stats.totals.liveSeconds)} />
            <Stat label="Biggest crowd" value={stats.totals.peakListeners} />
          </div>
          <div className="mt-4"><DailyChart days={stats.days} /></div>

          <h2 className="mt-12 font-display text-2xl font-extrabold">History</h2>
          {list.items.length === 0 ? (
            <Panel className="mt-4 py-14 text-center">
              <p className="font-display text-2xl font-extrabold">No rooms yet</p>
              <p className="mx-auto mt-2 max-w-sm text-white/55">Open your first room above. When it ends, its length, crowd size and reactions show up here.</p>
            </Panel>
          ) : (
            <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-char">
              {list.items.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="truncate font-semibold">{s.title}</div>
                    <div className="text-sm text-white/50">{formatDate(s.startedAt)} · code {s.code}</div>
                  </div>
                  <div className="text-sm text-white/70">{formatDuration(s.durationSec)} total · {formatDuration(s.liveSeconds)} live</div>
                  <div className="text-sm text-white/70">{s.uniqueListeners} listener{s.uniqueListeners === 1 ? "" : "s"} · peak {s.peakListeners}</div>
                  <div className="w-36 text-sm text-white/45">{s.status === "active" ? "Open now" : END_REASONS[s.endReason] || "Ended"}</div>
                  <button onClick={() => remove(s)} disabled={s.status === "active"} aria-label={`Delete ${s.title}`} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Newer</Button>
              <span className="text-white/50">Page {page} of {list.pages}</span>
              <Button variant="outline" disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)}>Older</Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
