import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createGitHubClient } from "@/lib/github";

// GET /api/gists/:id - Get a single gist
export async function GET(request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Fetch gist from GitHub API
    const gist = await github.getGist(id);

    return NextResponse.json(gist);
  } catch (error: any) {
    console.error(`Error fetching gist:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile page.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch gist" },
      { status: 500 }
    );
  }
}

// PATCH /api/gists/:id - Update a gist
export async function PATCH(request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

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

    // First, check if the user is the owner of the gist
    try {
      const gist = await github.getGist(id);

      // Verify ownership - only allow updates to user's own gists
      if (gist.owner.login !== session.user?.name) {
        return NextResponse.json(
          { error: "You can only edit your own gists" },
          { status: 403 }
        );
      }

      // Update gist on GitHub
      const updatedGist = await github.updateGist({
        gist_id: id,
        description: body.description,
        files: body.files,
      });

      return NextResponse.json(updatedGist);
    } catch (error: any) {
      // Check if the error is a not found error
      if (error.status === 404) {
        return NextResponse.json({ error: "Gist not found" }, { status: 404 });
      }

      throw error; // Re-throw for the main catch block
    }
  } catch (error: any) {
    console.error(`Error updating gist:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile page.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update gist" },
      { status: 500 }
    );
  }
}

// DELETE /api/gists/:id - Delete a gist
export async function DELETE(request: NextRequest, context: any) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // First, check if the user is the owner of the gist
    try {
      const gist = await github.getGist(id);

      // Verify ownership - only allow deletion of user's own gists
      if (gist.owner.login !== session.user?.name) {
        return NextResponse.json(
          { error: "You can only delete your own gists" },
          { status: 403 }
        );
      }

      // Delete gist on GitHub
      await github.deleteGist(id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      // Check if the error is a not found error
      if (error.status === 404) {
        return NextResponse.json({ error: "Gist not found" }, { status: 404 });
      }

      throw error; // Re-throw for the main catch block
    }
  } catch (error: any) {
    console.error(`Error deleting gist:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile page.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete gist" },
      { status: 500 }
    );
  }
}
