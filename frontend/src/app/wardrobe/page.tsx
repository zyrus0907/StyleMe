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

  async function download(url: string, name: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, "_blank");
    }
  }

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
              {o.result_url && (
                <>
                  <button className="dl" title="Download" onClick={() => download(o.result_url!, `styleme-${o.id}.png`)}>↓</button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.result_url} alt="" />
                </>
              )}
              {o.shop_url && (
                <div className="tile-foot">
                  <a className="shop-link" href={o.shop_url} target="_blank" rel="noopener noreferrer">
                    Shop this item ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}