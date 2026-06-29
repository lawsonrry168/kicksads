import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KickAds Content Engine",
  description: "AI-powered content generation and publishing dashboard for KickAds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%", overflow: "hidden" }}>
      <body style={{ height: "100%", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
