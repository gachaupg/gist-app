import { NextRequest, NextResponse } from "next/server";
import { createGitHubClient } from "@/lib/github";

// GET /api/public-gists/[id] - Get a single gist by ID without authentication
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gistId = params.id;

    if (!gistId) {
      return NextResponse.json(
        { error: "Gist ID is required" },
        { status: 400 }
      );
    }

    // Use the default token from the GitHub client
    const github = createGitHubClient();

    try {
      // Fetch the gist by ID
      const gist = await github.getGist(gistId);
      return NextResponse.json(gist);
    } catch (error: any) {
      console.error(`Error fetching gist ${gistId}:`, error);

      if (error.status === 404) {
        return NextResponse.json({ error: "Gist not found" }, { status: 404 });
      }

      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "Default GitHub token is invalid or rate limited. Try again later.",
          },
          { status: 401 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error in public gist API:", error);
    return NextResponse.json(
      { error: "Failed to fetch gist" },
      { status: 500 }
    );
  }
}
