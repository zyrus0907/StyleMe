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
      if (!data.session) {
        router.push("/sign-in");
        return;
      }
      const token = await getToken();
      if (token) setOutfits(await listOutfits(token));
      setLoading(false);
    })();
  }, [router]);

  return (
    <main style={{ maxWidth: 900, margin: "48px auto", padding: 24 }}>
      <h1>My Wardrobe</h1>
      <p><Link href="/try-on">← Try something else on</Link></p>
      {loading ? (
        <p>Loading…</p>
      ) : outfits.length === 0 ? (
        <p>No saved outfits yet. Generate a try-on and hit “Save to wardrobe.”</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginTop: 24 }}>
          {outfits.map((o) => (
            <div key={o.id} style={{ background: "#fff", borderRadius: 12, padding: 8, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              {o.result_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.result_url} alt="" style={{ width: "100%", borderRadius: 8 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}