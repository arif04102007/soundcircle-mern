import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { Spinner } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import HostRoom from "./pages/HostRoom";
import ListenerRoom from "./pages/ListenerRoom";

function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  return user ? <Outlet /> : <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
}

const NotFound = () => (
  <main className="mx-auto max-w-xl px-5 py-24 text-center">
    <p className="num text-7xl">404</p>
    <p className="mt-4 text-white/65">That page doesn't exist.</p>
    <a href="/" className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-forest">Back home</a>
  </main>
);

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/room/:code" element={<ListenerRoom />} />
          <Route element={<Protected />}>
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/room" element={<HostRoom />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <footer className="mx-auto w-full max-w-6xl px-5 py-8 text-sm text-white/40">SoundCircle · a real-time audio sharing app · MERN + WebRTC</footer>
    </div>
  );
}
