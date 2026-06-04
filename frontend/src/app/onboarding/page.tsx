"use client";

import { useState } from "react";
import { supabase, getToken } from "@/lib/supabase";
import { presignPhoto, confirmPhoto, setCanonical } from "@/lib/api";

const BUCKET = "fashion";

type UploadedPhoto = { id: string; url: string };

export default function OnboardingPage() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    if (!files.length) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");

      for (const file of files) {
        // 1. ask backend for a signed upload target
        const { path, token: uploadToken } = await presignPhoto(token, "jpg");
        // 2. upload the file straight to Supabase Storage
        const { error } = await supabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(path, uploadToken, file);
        if (error) throw error;
        // 3. record it; backend returns a readable url
        const row = await confirmPhoto(token, path);
        setPhotos((p) => [...p, { id: row.id, url: row.read_url }]);
      }
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!chosen) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      await setCanonical(token, chosen);
      setDone(true);
    } catch (err) {
      alert("Could not save profile: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main style={{ padding: 32 }}>
        <h1>You&apos;re set up! 🎉</h1>
        <p>Your canonical photo is saved. Head to the dashboard to try something on.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
      <h1>Create your fashion profile</h1>
      <p>Upload 2–5 clear, front-facing, full-body photos. Pick the best one as your base.</p>

      <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setChosen(p.id)}
            style={{
              border: chosen === p.id ? "3px solid #6d28d9" : "3px solid transparent",
              borderRadius: 12,
              padding: 0,
              cursor: "pointer",
              background: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" width={140} height={200} style={{ objectFit: "cover", borderRadius: 9 }} />
          </button>
        ))}
      </div>

      <button
        onClick={finish}
        disabled={!chosen || busy}
        style={{ marginTop: 24, padding: "10px 20px", borderRadius: 8 }}
      >
        {busy ? "Working…" : "Use this photo & finish"}
      </button>
    </main>
  );
}
