"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/sign-in");
      } else {
        setEmail(data.session.user.email ?? null);
        setLoading(false);
      }
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  if (loading) return <main className="card">Loading…</main>;

  return (
    <main className="card">
      <h1>Welcome 👋</h1>
      <p>Signed in as {email}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <Link href="/onboarding">
          <button>Set up / update my profile</button>
        </Link>
        <button onClick={signOut} style={{ background: "#e5e7eb", color: "#1a1a1a" }}>
          Sign out
        </button>
      </div>
    </main>
  );
}
