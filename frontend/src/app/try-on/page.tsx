"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getToken } from "@/lib/supabase";
import { presignGarment, createClothing, createTryOn, getTryOn, saveOutfit } from "@/lib/api";

const BUCKET = "fashion";

export default function TryOnPage() {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("upper");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [tryOnId, setTryOnId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/sign-in");
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [router]);

  async function generate() {
    setBusy(true); setResult(null); setSaved(false); setTryOnId(null); setStatus("Preparing…");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const payload: { category: string; path?: string; external_url?: string } = { category };
      if (mode === "upload") {
        if (!file) throw new Error("Choose a garment image");
        const { path, token: uploadToken } = await presignGarment(token, "jpg");
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, uploadToken, file);
        if (error) throw error;
        payload.path = path;
      } else {
        if (!url) throw new Error("Paste a direct image URL");
        payload.external_url = url;
      }
      const item = await createClothing(token, payload);
      setStatus("Styling your look… (10–30s)");
      const tryon = await createTryOn(token, item.id);
      pollRef.current = setInterval(async () => {
        const t = await getTryOn(token, tryon.id);
        if (t.status === "done") {
          clearInterval(pollRef.current!);
          setResult(t.result_url); setTryOnId(t.id); setStatus(""); setBusy(false);
        } else if (t.status === "failed") {
          clearInterval(pollRef.current!);
          setStatus("Failed: " + (t.error ?? "unknown error")); setBusy(false);
        }
      }, 2000);
    } catch (e) {
      setStatus("Error: " + (e as Error).message); setBusy(false);
    }
  }

  async function save() {
    const token = await getToken();
    if (!token || !tryOnId) return;
    await saveOutfit(token, tryOnId);
    setSaved(true);
  }

  return (
    <main className="page container">
      <p className="eyebrow">The Fitting Room</p>
      <h1>Try something on</h1>

      <div className="panel" style={{ marginTop: 28 }}>
        <div className="seg">
          <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Upload image</button>
          <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}>Paste URL</button>
        </div>

        {mode === "upload" ? (
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        ) : (
          <input type="text" placeholder="https://.../shirt.jpg" value={url} onChange={(e) => setUrl(e.target.value)} />
        )}

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="upper">Top / upper body</option>
          <option value="lower">Bottom / lower body</option>
          <option value="full">Full outfit / dress</option>
        </select>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-block" onClick={generate} disabled={busy}>
            {busy ? "Working…" : "Generate look"}
          </button>
        </div>

        {status && <p className="status">{status}</p>}

        {result && (
          <>
            <div className="result-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="try-on result" />
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-ghost btn-block" onClick={save} disabled={saved}>
                {saved ? "Saved to wardrobe ✓" : "Save to wardrobe"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}