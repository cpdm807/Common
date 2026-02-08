import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export const metadata: Metadata = {
  title: "Create Football Squares – No Account Required",
  description: "Create a football squares board. 10x10 grid, claim squares by name. Share a single link. Perfect for Super Bowl and game-day pools.",
  keywords: ["create football squares", "super bowl squares", "game pool", "squares contest"],
  alternates: {
    canonical: `${baseUrl}/tools/squares/create`,
  },
  openGraph: {
    title: "Create Football Squares | Common",
    description: "Create a football squares board. 10x10 grid, claim squares by name.",
    url: `${baseUrl}/tools/squares/create`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreateSquaresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
