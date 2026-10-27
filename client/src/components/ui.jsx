import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-crimson text-white hover:bg-crimson-hi disabled:hover:bg-crimson",
  light: "bg-white text-forest hover:bg-white/85",
  outline: "border border-white/20 text-white hover:bg-white/10",
  ghost: "text-white/70 hover:text-white hover:bg-white/10",
};

export function Button({ variant = "primary", loading, className = "", children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const Panel = ({ className = "", children }) => (
  <section className={`rounded-3xl border border-white/10 bg-char p-6 ${className}`}>{children}</section>
);

export const Field = ({ label, error, ...rest }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
    <input
      {...rest}
      className="w-full rounded-xl border border-white/15 bg-forest px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none"
    />
    {error && <span className="mt-1 block text-sm text-[#ff8a86]">{error}</span>}
  </label>
);

export const Spinner = ({ label = "Loading…" }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-24 text-white/60">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}
  </div>
);

export const OnAir = ({ live, label }) => (
  <span className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ${live ? "bg-crimson text-white" : "border border-white/15 text-white/60"}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${live ? "lamp bg-white" : "bg-white/30"}`} aria-hidden />
    {label || (live ? "On air" : "Standby")}
  </span>
);
