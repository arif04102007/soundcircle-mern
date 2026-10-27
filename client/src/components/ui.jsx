import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-lavender text-white hover:bg-lavender-hi shadow-[0_0_20px_rgba(166,107,255,0.25)] disabled:hover:bg-lavender",
  rose: "bg-rose text-white hover:bg-rose-hi shadow-[0_0_20px_rgba(255,45,149,0.25)]",
  light: "bg-white text-void hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]",
  outline: "border border-white/15 text-white hover:border-lavender/40 hover:bg-white/5",
  ghost: "text-white/70 hover:text-white hover:bg-white/10",
  danger: "bg-crimson text-white hover:bg-crimson-hi",
};

export function Button({ variant = "primary", loading, className = "", children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const Panel = ({ className = "", children }) => (
  <section className={`rounded-3xl border border-white/8 bg-char p-6 shadow-xl ${className}`}>{children}</section>
);

export const Field = ({ label, error, ...rest }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
    <input
      {...rest}
      className="w-full rounded-xl border border-white/12 bg-raised px-4 py-3 text-base text-white placeholder:text-white/25 transition-colors focus:border-lavender/50 focus:outline-none focus:shadow-[0_0_0_3px_rgba(166,107,255,0.12)]"
    />
    {error && <span className="mt-1 block text-sm text-rose">{error}</span>}
  </label>
);

export const Spinner = ({ label = "Loading…" }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-24 text-lavender">
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> <span className="text-white/70 font-medium">{label}</span>
  </div>
);

export const OnAir = ({ live, label }) => (
  <span className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold tracking-wide transition-all ${
    live ? "bg-crimson text-white shadow-[0_0_20px_rgba(163,28,27,0.5)]" : "border border-white/15 text-white/50"
  }`}>
    <span className={`h-2.5 w-2.5 rounded-full ${live ? "lamp bg-white" : "bg-white/30"}`} aria-hidden />
    {label || (live ? "ON AIR" : "STANDBY")}
  </span>
);

