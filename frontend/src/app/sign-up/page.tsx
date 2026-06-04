"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    setBusy(true); setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (data.session) router.push("/onboarding");
    else setMsg("Account created. Check your email to confirm, then sign in.");
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-brand">
        <span className="mark">STYLEME</span>
        <p className="quote">“The fitting room, reimagined for the way you actually shop.”</p>
        <span className="foot">Your virtual atelier</span>
      </aside>
      <section className="auth-form-side">
        <div className="auth-card">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Set your profile once. Try on everything after.</p>
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
            {busy ? "Working…" : "Sign up"}
          </button>
          <p className="switch-link">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}