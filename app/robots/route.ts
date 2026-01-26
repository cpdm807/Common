import { NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://common.bz";

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /tools
Allow: /tools/poll
Allow: /tools/availability
Allow: /tools/board
Allow: /tools/readiness
Allow: /examples
Allow: /use-cases
Disallow: /api
Disallow: /polls/
Disallow: /board/
Disallow: /b/
Disallow: /m/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
