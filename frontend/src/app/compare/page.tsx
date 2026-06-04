"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, getToken } from "@/lib/supabase";
import { listOutfits, Outfit } from "@/lib/api";

export default function ComparePage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
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

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]
    );
  }

  const chosen = outfits.filter((o) => selected.includes(o.id));

  if (loading) return <main className="page container"><p className="muted">Loading…</p></main>;

  return (
    <main className="page container">
      <p className="eyebrow">Side by Side</p>
      <h1>Compare looks</h1>
      <p className="muted">Pick up to four saved looks to view together.</p>

      {outfits.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>
          No saved looks yet. <Link href="/try-on">Create one →</Link>
        </p>
      ) : (
        <>
          <div className="picker">
            {outfits.map((o) => (
              <button
                key={o.id}
                className={"pick" + (selected.includes(o.id) ? " active" : "")}
                onClick={() => toggle(o.id)}
              >
                {o.result_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.result_url} alt="" />
                )}
              </button>
            ))}
          </div>

          {chosen.length === 0 ? (
            <p className="muted">Select looks above to compare them.</p>
          ) : (
            <div className="compare-row" style={{ gridTemplateColumns: `repeat(${chosen.length}, 1fr)` }}>
              {chosen.map((o) => (
                <div key={o.id} className="compare-cell">
                  {o.result_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.result_url} alt="" />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}