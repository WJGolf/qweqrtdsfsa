"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up") return setMsg("Account created. Check your email to confirm, then sign in.");
    router.push("/"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="panel mx-auto mt-10 max-w-sm space-y-3 p-6">
      <h1 className="font-display text-xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" type="password" required minLength={6} placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="text-sm text-gold" role="alert">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</button>
      <button type="button" className="text-sm text-mute underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account? Create one" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
