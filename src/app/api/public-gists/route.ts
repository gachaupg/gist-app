import { NextRequest, NextResponse } from "next/server";
import { createGitHubClient } from "@/lib/github";

// GET /api/public-gists - Get public gists for the home page
export async function GET(req: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const per_page = Number(searchParams.get("per_page")) || 30;
    const page = Number(searchParams.get("page")) || 1;

    // Create a GitHub client - no token needed for public gists
    const github = createGitHubClient();

    // Fetch public gists from GitHub API
    try {
      // Use the dedicated public gists endpoint which has a higher rate limit
      const gists = await github.listPublicGists(per_page, page);
      return NextResponse.json(gists);
    } catch (error: any) {
      console.error("Error fetching public gists:", error);

      // Handle rate limiting
      if (
        error.status === 403 &&
        error.response?.headers?.["x-ratelimit-remaining"] === "0"
      ) {
        const resetTime = error.response?.headers?.["x-ratelimit-reset"];
        const resetDate = resetTime
          ? new Date(Number(resetTime) * 1000).toISOString()
          : "soon";

        return NextResponse.json(
          {
            error: `GitHub API rate limit exceeded. Rate limit will reset at ${resetDate}.`,
          },
          { status: 429 }
        );
      }

      // Handle authentication errors
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "Unable to access GitHub API. Try again later.",
          },
          { status: 401 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error in public gists API:", error);
    return NextResponse.json(
      { error: "Failed to fetch public gists" },
      { status: 500 }
    );
  }
}
