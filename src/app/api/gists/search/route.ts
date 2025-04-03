import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Octokit } from "octokit";

// GET /api/gists/search - Search gists
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user with GitHub token
    const user = await User.findById(session.user?.id).select("githubToken");

    // Use user token or default token
    const authToken =
      user?.githubToken || "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";

    // Create GitHub client with Octokit directly for search functionality
    const octokit = new Octokit({ auth: authToken });

    // Search for gists (GitHub's API doesn't have a direct gist search endpoint for content)
    // So we'll get all user's gists and filter them
    const response = await octokit.request("GET /gists", {
      per_page: 100, // Get up to 100 gists
    });

    // Filter gists by search query
    const filteredGists = response.data.filter((gist) => {
      // Check if the description contains the query
      if (
        gist.description &&
        gist.description.toLowerCase().includes(query.toLowerCase())
      ) {
        return true;
      }

      // Check if any filename contains the query
      for (const filename in gist.files) {
        if (filename.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }

        // If we have access to content at this point, search in it too
        const file = gist.files[filename];
        if (
          file.content &&
          file.content.toLowerCase().includes(query.toLowerCase())
        ) {
          return true;
        }
      }

      return false;
    });

    // For each filtered gist, fetch its content if we don't have it
    const gistsWithContent = await Promise.all(
      filteredGists.map(async (gist) => {
        // If we already have content for all files, return as is
        let needContent = false;
        for (const filename in gist.files) {
          if (!gist.files[filename].content) {
            needContent = true;
            break;
          }
        }

        // If we need content, fetch the full gist
        if (needContent) {
          try {
            const fullGist = await octokit.request(`GET /gists/${gist.id}`);
            return fullGist.data;
          } catch (err) {
            console.error(`Error fetching full gist ${gist.id}:`, err);
            return gist;
          }
        }

        return gist;
      })
    );

    // Final filtering based on content if needed
    const finalFilteredGists = gistsWithContent.filter((gist) => {
      // If we've already matched on filename or description, include it
      if (
        gist.description &&
        gist.description.toLowerCase().includes(query.toLowerCase())
      ) {
        return true;
      }

      for (const filename in gist.files) {
        if (filename.toLowerCase().includes(query.toLowerCase())) {
          return true;
        }

        // Check content now that we have it
        const file = gist.files[filename];
        if (
          file.content &&
          file.content.toLowerCase().includes(query.toLowerCase())
        ) {
          return true;
        }
      }

      return false;
    });

    return NextResponse.json(finalFilteredGists);
  } catch (error: any) {
    console.error("Error searching gists:", error);

    // Handle GitHub API errors
    if (error.status === 401) {
      return NextResponse.json(
        {
          error: "Invalid GitHub token. Please try again later.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search gists" },
      { status: 500 }
    );
  }
}
