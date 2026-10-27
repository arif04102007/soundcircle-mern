export function formatDuration(sec = 0) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}
export const formatDate = (d) => new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const END_REASONS = {
  host_ended: "Ended by host",
  host_disconnected: "Host disconnected",
  expired: "Expired (idle)",
  server_restart: "Server restarted",
  server_shutdown: "Server shut down",
};
export const randomGuestName = () => `Guest ${Math.floor(100 + Math.random() * 900)}`;
export const savedName = () => localStorage.getItem("sc_name") || "";
export const clientId = () => {
  let id = localStorage.getItem("sc_cid");
  if (!id) { id = crypto.randomUUID?.() || String(Math.random()).slice(2); localStorage.setItem("sc_cid", id); }
  return id;
};
