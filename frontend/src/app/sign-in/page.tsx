"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    router.push("/dashboard");
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-brand">
        <span className="mark">STYLEME</span>
        <p className="quote">“Welcome back. Your wardrobe missed you.”</p>
        <span className="foot">Your virtual atelier</span>
      </aside>
      <section className="auth-form-side">
        <div className="auth-card">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-sub">Pick up right where you left off.</p>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {msg && <p className="error">{msg}</p>}
          <button className="btn btn-primary btn-block" onClick={submit} disabled={busy || !email || !password}>
            {busy ? "Working…" : "Sign in"}
          </button>
          <p className="switch-link">No account? <Link href="/sign-up">Create one</Link></p>
        </div>
      </section>
    </div>
  );
}