"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, getToken } from "@/lib/supabase";
import { listOutfits, Outfit } from "@/lib/api";

export default function WardrobePage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/sign-in"); return; }
      const token = await getToken();
      if (token) setOutfits(await listOutfits(token));
      setLoading(false);
    })();
  }, [router]);

  return (
    <main className="page container">
      <p className="eyebrow">Your Lookbook</p>
      <h1>My Wardrobe</h1>
      <p className="muted"><Link href="/try-on">← Back to the fitting room</Link></p>

      {loading ? (
        <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
      ) : outfits.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>No saved looks yet. Generate a try-on and hit “Save to wardrobe.”</p>
      ) : (
        <div className="grid">
          {outfits.map((o) => (
            <div key={o.id} className="tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {o.result_url && <img src={o.result_url} alt="" />}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}