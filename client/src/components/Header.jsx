import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="9" fill="#A31C1B" />
        <circle cx="32" cy="32" r="18" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="4" />
        <circle cx="32" cy="32" r="27" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="4" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">SoundCircle</span>
    </span>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Link to="/" aria-label="SoundCircle home"><Logo /></Link>
      <nav className="flex items-center gap-1 text-sm font-medium">
        {user ? (
          <>
            <NavLink to="/studio" className="rounded-full px-4 py-2 text-white/75 hover:bg-white/10 hover:text-white">Studio</NavLink>
            <span className="hidden px-3 text-white/45 sm:inline">{user.name}</span>
            <button onClick={() => { logout(); nav("/"); }} className="rounded-full px-4 py-2 text-white/75 hover:bg-white/10 hover:text-white">Sign out</button>
          </>
        ) : (
          <NavLink to="/auth" className="rounded-full border border-white/20 px-5 py-2 hover:bg-white/10">Sign in to host</NavLink>
        )}
      </nav>
    </header>
  );
}
