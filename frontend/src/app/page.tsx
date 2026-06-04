import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="kicker">Virtual Fashion Atelier</p>
        <h1 className="hero-title">
          Try it on<br />
          <em>before</em> you<br />
          ever touch it.
        </h1>
        <p className="hero-sub">
          Build your fashion profile once. Then see yourself in anything — no re-uploading,
          no fitting rooms, no guesswork.
        </p>
        <div className="hero-actions">
          <Link href="/sign-up" className="btn btn-primary">Create your profile</Link>
          <Link href="/sign-in" className="btn btn-ghost">Sign in</Link>
        </div>
      </section>

      <section className="steps">
        <div className="step">
          <span className="num">01</span>
          <h3>Set your profile</h3>
          <p>Upload a few photos once. We keep your best look on file forever.</p>
        </div>
        <div className="step">
          <span className="num">02</span>
          <h3>Drop a garment</h3>
          <p>Upload or link any piece you're curious about wearing.</p>
        </div>
        <div className="step">
          <span className="num">03</span>
          <h3>See yourself</h3>
          <p>Our AI dresses you — your face, body and pose, kept intact.</p>
        </div>
      </section>
    </main>
  );
}