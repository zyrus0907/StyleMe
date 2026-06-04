"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getToken } from "@/lib/supabase";
import { deleteAccount } from "@/lib/api";

export default function Settings() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/sign-in");
      else { setEmail(data.session.user.email ?? null); setLoading(false); }
    });
  }, [router]);

  async function handleDelete() {
    setBusy(true);
    try {
      const token = await getToken();
      if (token) await deleteAccount(token);
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      alert("Could not delete account: " + (e as Error).message);
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <main className="page container"><p className="muted">Loading…</p></main>;

  return (
    <main className="page container">
      <p className="eyebrow">Account</p>
      <h1>Settings</h1>

      <div className="panel" style={{ marginTop: 24 }}>
        <label>Email</label>
        <p style={{ margin: "0 0 18px" }}>{email}</p>
        <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
      </div>

      <div className="danger-zone">
        <h3>Delete account</h3>
        <p className="muted">
          This permanently removes your profile, photos, wardrobe and every saved look. It can't be undone.
        </p>
        {!confirming ? (
          <button className="btn btn-danger" onClick={() => setConfirming(true)}>Delete my account</button>
        ) : (
          <div>
            <p>Are you absolutely sure?</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-danger" onClick={handleDelete} disabled={busy}>
                {busy ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}