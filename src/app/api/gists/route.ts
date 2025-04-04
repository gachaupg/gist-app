import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createGitHubClient } from "@/lib/github";

// Zod schema for gist creation
const gistSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  public: z.boolean().default(false),
});

// GET /api/gists - Get user's gists
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const per_page = Number(searchParams.get("per_page")) || 30;
    const page = Number(searchParams.get("page")) || 1;

    // Connect to database
    await dbConnect();

    // Find user with GitHub token
    const user = await User.findById(session.user?.id).select("githubToken");

    if (!user?.githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub token not found. Please add your token in the profile page.",
        },
        { status: 400 }
      );
    }

    // Create GitHub client with user token
    const github = createGitHubClient(user.githubToken);

    try {
      // Get the authenticated GitHub user to ensure we're getting only their gists
      const authUser = await github.getAuthenticatedUser();

      // Fetch gists from GitHub API for the authenticated user
      const gists = await github.listUserGists(authUser.login, per_page, page);

      return NextResponse.json(gists);
    } catch (error: any) {
      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "Invalid GitHub token. Please update your token in the profile page.",
          },
          { status: 401 }
        );
      }
      throw error; // Rethrow for the outer catch block
    }
  } catch (error: any) {
    console.error("Error fetching gists:", error);

    // Handle GitHub API errors
    if (error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile page.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch gists" },
      { status: 500 }
    );
  }
}

// POST /api/gists - Create a new gist
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate request body
    const result = gistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    const { filename, description, content, public: isPublic } = result.data;

    // Connect to database
    await dbConnect();

    // Find user with GitHub token
    const user = await User.findById(session.user?.id).select("githubToken");

    if (!user?.githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub token not found. Please add your token in the profile page.",
        },
        { status: 400 }
      );
    }

    // Create GitHub client with user token
    const github = createGitHubClient(user.githubToken);

    // Create gist on GitHub
    const newGist = await github.createGist({
      description: description || "",
      public: isPublic,
      files: {
        [filename]: {
          content,
        },
      },
    });

    return NextResponse.json(newGist, { status: 201 });
  } catch (error: any) {
    console.error("Error creating gist:", error);

    // Handle GitHub API errors
    if (error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile page.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create gist" },
      { status: 500 }
    );
  }
}
