import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getBoard } from "@/lib/dynamodb";
import { getBoardShareCopy } from "@/lib/tools";

// Use Node.js runtime instead of edge to ensure DynamoDB access works reliably
// export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    let board;
    try {
      board = await getBoard(boardId);
    } catch (dbError) {
      console.error("Error fetching board for OG image:", dbError);
      board = null;
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    const expired = board ? now > board.expiresAtUserVisible : true;
    const boardNotFound = !board;

    // Get share copy for rendering
    // Only mark as expired/unavailable if board is actually missing or expired
    const copy = getBoardShareCopy(
      board?.toolType || "availability",
      board?.title,
      expired || boardNotFound
    );

    // Determine spacing based on whether subheading exists
    const hasSubheading = copy.subheading && copy.subheading.trim().length > 0;
    const topPadding = hasSubheading ? "80px" : "120px";
    const subheadingMarginBottom = hasSubheading ? "120px" : "0px";

    // Helper to wrap long titles to 2 lines max
    const wrapTitle = (title: string, maxLength: number = 50): string[] => {
      if (title.length <= maxLength) return [title];
      // Try to find a good break point (space or punctuation)
      const firstLine = title.substring(0, maxLength);
      const lastSpace = Math.max(
        firstLine.lastIndexOf(" "),
        firstLine.lastIndexOf("-"),
        firstLine.lastIndexOf(","),
        maxLength * 0.7 // Fallback to ~70% if no good break
      );
      const line1 = title.substring(0, lastSpace).trim();
      const line2 = title.substring(lastSpace).trim();
      if (line2.length > maxLength) {
        // Still too long, truncate second line
        return [line1, line2.substring(0, maxLength - 3) + "..."];
      }
      return [line1, line2];
    };

    const subheadingLines = hasSubheading ? wrapTitle(copy.subheading) : [];

    // Create the OG image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            background: "#fafafa",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: topPadding,
            paddingBottom: "100px",
            paddingLeft: "80px",
            paddingRight: "80px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            position: "relative",
          }}
        >
          {/* Main heading */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: "700",
              color: "#171717",
              textAlign: "center",
              marginBottom: hasSubheading ? "24px" : "80px",
              lineHeight: "1.2",
            }}
          >
            {copy.heading}
          </div>

          {/* Subheading - only render if exists */}
          {hasSubheading && (
            <div
              style={{
                fontSize: "32px",
                fontWeight: "400",
                color: "#525252",
                textAlign: "center",
                marginBottom: subheadingMarginBottom,
                lineHeight: "1.3",
              }}
            >
              {subheadingLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}

          {/* Footer - trust line (only if not expired) */}
          {copy.trustLine && (
            <div
              style={{
                position: "absolute",
                bottom: "60px",
                left: "0",
                right: "0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "500",
                  color: "#525252",
                  textAlign: "center",
                }}
              >
                {copy.trustLine}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "400",
                  color: "#737373",
                  textAlign: "center",
                }}
              >
                common.bz
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Add cache headers
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    
    // Fallback image (for errors, expired boards already handled above)
    const fallbackImage = new ImageResponse(
      (
        <div
          style={{
            background: "#fafafa",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "120px",
            paddingBottom: "100px",
            paddingLeft: "80px",
            paddingRight: "80px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "700",
              color: "#171717",
              textAlign: "center",
              marginBottom: "80px",
              lineHeight: "1.2",
            }}
          >
            Board unavailable
          </div>
          {/* No subheading or trust line for unavailable boards */}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Return fallback with cache headers
    return new NextResponse(fallbackImage.body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }
}
