"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getToken } from "@/lib/supabase";
import { presignGarment, createClothing, createTryOn, getTryOn, saveOutfit } from "@/lib/api";

const BUCKET = "fashion";

export default function TryOnPage() {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    supabase.auth.getSession().then(({ data }) => { if (!data.session) router.push("/sign-in"); });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [router]);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function reset() {
    setResult(null); setTryOnId(null); setSaved(false); setStatus("");
    setFile(null); setPreview(null); setUrl("");
  }

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
      <p className="muted" style={{ marginBottom: 24 }}>
        Upload a piece or paste a link — we’ll dress your saved profile in it.
      </p>

      <div className="panel">
        <div className="seg">
          <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Upload image</button>
          <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}>Paste URL</button>
        </div>

        {mode === "upload" ? (
          <>
            <input type="file" accept="image/*" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="garment" className="garment-preview" />
            )}
          </>
        ) : (
          <input type="text" placeholder="https://.../shirt.jpg" value={url} onChange={(e) => setUrl(e.target.value)} />
        )}

        <label style={{ marginTop: 16 }}>Category</label>
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
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saved}>
                {saved ? "Saved ✓" : "Save to wardrobe"}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Try another</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}