import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "StyleMe — Your virtual fitting room",
  description: "Build your fashion profile once. See yourself in anything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
        <Nav />
        {children}
      </body>
    </html>
  );
}