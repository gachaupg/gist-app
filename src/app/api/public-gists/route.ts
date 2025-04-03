import { NextRequest, NextResponse } from "next/server";
import { createGitHubClient } from "@/lib/github";

// GET /api/public-gists - Get public gists for the home page
export async function GET(req: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const per_page = Number(searchParams.get("per_page")) || 30;
    const page = Number(searchParams.get("page")) || 1;

    // Use the default token from the GitHub client
    // This will fetch public gists only, without requiring user authentication
    const github = createGitHubClient();

    // Fetch public gists from GitHub API
    try {
      const gists = await github.listGists(per_page, page);
      return NextResponse.json(gists);
    } catch (error: any) {
      console.error("Error fetching public gists:", error);
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "Default GitHub token is invalid or rate limited. Try again later.",
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