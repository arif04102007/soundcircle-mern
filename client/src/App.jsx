import { Navigate, Outlet, Route, Routes, useLocation, Link } from "react-router-dom";
import Header from "./components/Header";
import { Spinner } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import HostRoom from "./pages/HostRoom";
import ListenerRoom from "./pages/ListenerRoom";
import About from "./pages/About";

function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
}

const NotFound = () => (
  <main className="mx-auto max-w-xl px-5 py-28 text-center">
    <p className="num text-8xl font-black text-lavender/30">404</p>
    <h1 className="mt-4 font-display text-3xl font-extrabold text-white">Lost in the Frequency?</h1>
    <p className="mt-3 text-white/55 text-sm">That page or broadcast frequency doesn't exist.</p>
    <Link
      to="/"
      className="mt-8 inline-flex items-center gap-2 rounded-full bg-lavender px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(166,107,255,0.3)] hover:bg-lavender-hi transition-all"
    >
      Return to Safety →
    </Link>
  </main>
);

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-void text-white selection:bg-lavender selection:text-white">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/room/:code" element={<ListenerRoom />} />
          <Route element={<Protected />}>
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/room" element={<HostRoom />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <footer className="border-t border-white/6 bg-void/60 py-10 px-5 text-sm text-white/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            SoundCircle · Real-time WebRTC audio distribution · MERN Stack
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/" className="hover:text-lavender transition-colors">Home</Link>
            <Link to="/about" className="hover:text-lavender transition-colors">Architecture &amp; Docs</Link>
            <a href="/#pricing" className="hover:text-lavender transition-colors">Pricing</a>
            <Link to="/auth" className="hover:text-lavender transition-colors">Host Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

