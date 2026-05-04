import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPTV Admin Panel",
  description: "Premium IPTV management panel with validity features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <h2>IPTV Cloud Panel</h2>
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Admin</span>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
