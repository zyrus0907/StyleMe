"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
  const [signedIn, setSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const sub = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">STYLEME</Link>
        <nav className="nav-links">
          <Link href="/try-on">Fitting Room</Link>
          <Link href="/wardrobe">Wardrobe</Link>
          {signedIn ? (
            <button className="nav-cta" onClick={signOut}>Sign out</button>
          ) : (
            <Link href="/sign-in" className="nav-cta">Sign in</Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}