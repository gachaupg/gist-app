import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createGitHubClient } from "@/lib/github";

type RouteParams = { params: { id: string } };

// GET /api/gists/:id - Get a single gist
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Find user with GitHub token
    const user = await User.findById(session.user?.id).select("githubToken");

    if (!user || !user.githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub token not found. Please add your token in the profile settings.",
        },
        { status: 400 }
      );
    }

    // Create GitHub client
    const github = createGitHubClient(user.githubToken);

    // Fetch gist from GitHub API
    const gist = await github.getGist(params.id);

    return NextResponse.json(gist);
  } catch (error: Error & { status?: number }) {
    console.error(`Error fetching gist ${params.id}:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile settings.",
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
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
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

    if (!user || !user.githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub token not found. Please add your token in the profile settings.",
        },
        { status: 400 }
      );
    }

    // Create GitHub client
    const github = createGitHubClient(user.githubToken);

    // Update gist on GitHub
    const updatedGist = await github.updateGist({
      gist_id: params.id,
      description: body.description,
      files: body.files,
    });

    return NextResponse.json(updatedGist);
  } catch (error: Error & { status?: number }) {
    console.error(`Error updating gist ${params.id}:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile settings.",
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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Find user with GitHub token
    const user = await User.findById(session.user?.id).select("githubToken");

    if (!user || !user.githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub token not found. Please add your token in the profile settings.",
        },
        { status: 400 }
      );
    }

    // Create GitHub client
    const github = createGitHubClient(user.githubToken);

    // Delete gist on GitHub
    await github.deleteGist(params.id);

    return NextResponse.json({ success: true });
  } catch (error: Error & { status?: number }) {
    console.error(`Error deleting gist ${params.id}:`, error);

    // Handle GitHub API errors
    if ("status" in error && error.status === 404) {
      return NextResponse.json({ error: "Gist not found" }, { status: 404 });
    }

    if ("status" in error && error.status === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub token. Please update your token in the profile settings.",
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
