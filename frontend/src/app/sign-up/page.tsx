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
    setBusy(true);
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    if (data.session) {
      router.push("/onboarding"); // email confirmation is off -> straight in
    } else {
      setMsg("Account created. Check your email to confirm, then sign in.");
    }
  }

  return (
    <main className="card">
      <h1>Create account</h1>
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="error">{msg}</p>}
      <button onClick={submit} disabled={busy || !email || !password}>
        {busy ? "Working…" : "Sign up"}
      </button>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
