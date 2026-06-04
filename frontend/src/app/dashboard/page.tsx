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
      if (!data.session) router.push("/sign-in");
      else { setEmail(data.session.user.email ?? null); setLoading(false); }
    });
  }, [router]);

  if (loading) return <main className="page container"><p className="muted">Loading…</p></main>;

  return (
    <main className="page container">
      <p className="eyebrow">Your Atelier</p>
      <h1>Welcome back</h1>
      <p className="muted">{email}</p>

      <div className="hub">
        <Link href="/try-on" className="hub-card">
          <span className="hub-num">01</span>
          <h3>Fitting Room</h3>
          <p>Try a new piece on your saved profile.</p>
        </Link>
        <Link href="/wardrobe" className="hub-card">
          <span className="hub-num">02</span>
          <h3>Wardrobe</h3>
          <p>Browse and download your saved looks.</p>
        </Link>
        <Link href="/onboarding" className="hub-card">
          <span className="hub-num">03</span>
          <h3>Profile</h3>
          <p>Update the base photo we dress.</p>
        </Link>
        <Link href="/settings" className="hub-card">
          <span className="hub-num">04</span>
          <h3>Settings</h3>
          <p>Manage your account.</p>
        </Link>
      </div>
    </main>
  );
}