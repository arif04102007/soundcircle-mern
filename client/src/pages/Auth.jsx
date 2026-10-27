import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Field, Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dest = loc.state?.from || "/studio";

  if (user) return <Navigate to={dest} replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      nav(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <Panel className="p-8">
        <h1 className="font-display text-3xl font-extrabold">{mode === "login" ? "Welcome back" : "Create your host account"}</h1>
        <p className="mt-2 text-sm text-white/60">Listeners never need an account. You only sign in to host and keep your session history.</p>
        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          {mode === "register" && <Field label="Name" value={form.name} onChange={set("name")} autoComplete="name" maxLength={40} required />}
          <Field label="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
          <Field label="Password" type="password" value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "register" ? "At least 8 characters" : ""} required />
          <p role="alert" className="min-h-5 text-sm text-[#ff8a86]">{error}</p>
          <Button type="submit" variant="light" loading={busy} className="w-full py-3.5">{mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-6 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </Panel>
    </main>
  );
}
