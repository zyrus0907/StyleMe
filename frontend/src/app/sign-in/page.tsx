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
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="card">
      <h1>Sign in</h1>
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="error">{msg}</p>}
      <button onClick={submit} disabled={busy || !email || !password}>
        {busy ? "Working…" : "Sign in"}
      </button>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        No account? <Link href="/sign-up">Create one</Link>
      </p>
    </main>
  );
}
