import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 group">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden className="transition-transform group-hover:scale-105">
        <circle cx="32" cy="32" r="9" fill="#A66BFF" />
        <circle cx="32" cy="32" r="18" fill="none" stroke="#A66BFF" strokeOpacity=".5" strokeWidth="3.5" />
        <circle cx="32" cy="32" r="27" fill="none" stroke="#FF2D95" strokeOpacity=".35" strokeWidth="2.5" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-lavender-hi transition-colors">
        SoundCircle
      </span>
    </span>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/6 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" aria-label="SoundCircle home">
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-full px-4 py-2 transition-colors ${isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 transition-colors ${isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`
            }
          >
            About
          </NavLink>
          <a
            href="/#join"
            className="rounded-full px-4 py-2 text-white/60 transition-colors hover:text-white hover:bg-white/5"
          >
            Tune In
          </a>
          <a
            href="/#pricing"
            className="rounded-full px-4 py-2 text-white/60 transition-colors hover:text-white hover:bg-white/5"
          >
            Pricing
          </a>

          <div className="ml-3 flex items-center gap-2 pl-3 border-l border-white/10">
            {user ? (
              <>
                <NavLink
                  to="/studio"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold transition-all ${
                      isActive
                        ? "bg-lavender text-white shadow-[0_0_20px_rgba(166,107,255,0.35)]"
                        : "bg-lavender/20 text-lavender hover:bg-lavender/30"
                    }`
                  }
                >
                  <Radio className="h-3.5 w-3.5" /> Studio
                </NavLink>
                <span className="hidden lg:inline text-xs font-semibold px-2 text-white/40">{user.name}</span>
                <button
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                  className="rounded-full px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink
                to="/auth"
                className="rounded-full bg-lavender px-5 py-2 font-semibold text-white shadow-[0_0_20px_rgba(166,107,255,0.25)] transition-all hover:bg-lavender-hi"
              >
                Sign in to host
              </NavLink>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="md:hidden rounded-xl border border-white/10 p-2 text-white/70 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/10 bg-char px-5 py-4 space-y-2">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5"
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5"
          >
            About & Architecture
          </NavLink>
          <a
            href="/#join"
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5"
          >
            Tune In
          </a>
          <a
            href="/#pricing"
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5"
          >
            Pricing
          </a>

          <div className="pt-3 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <NavLink
                  to="/studio"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-lavender py-3 text-sm font-semibold text-white"
                >
                  <Radio className="h-4 w-4" /> Go to Studio ({user.name})
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    nav("/");
                  }}
                  className="block w-full text-center text-xs text-white/50 py-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <NavLink
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block text-center w-full rounded-full bg-lavender py-3 text-sm font-semibold text-white"
              >
                Sign in to host
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

