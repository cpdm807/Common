import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Common – When things get messy, find what's common",
  description: "Lightweight tools to help groups align without meetings, accounts, or noise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
