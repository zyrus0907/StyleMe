import Link from "next/link";

export default function Home() {
  return (
    <main className="card">
      <h1>StyleMe 👗</h1>
      <p>Create your fashion profile once, then try on anything — no re-uploading photos.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Link href="/sign-up">
          <button>Create account</button>
        </Link>
        <Link href="/sign-in">
          <button style={{ background: "#e5e7eb", color: "#1a1a1a" }}>Sign in</button>
        </Link>
      </div>
    </main>
  );
}
