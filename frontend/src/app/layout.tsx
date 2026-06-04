import "./globals.css";

export const metadata = {
  title: "StyleMe",
  description: "Create a fashion profile once, try on anything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
