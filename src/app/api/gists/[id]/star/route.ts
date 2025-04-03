import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createGitHubClient } from "@/lib/github";

// GET /api/gists/:id/star - Check if a gist is starred
export async function GET(req: NextRequest, context: any) {
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

    // Create GitHub client with user token or default token
    const github = createGitHubClient(user?.githubToken);

    // Check if gist is starred
    const isStarred = await github.isGistStarred(id);

    return NextResponse.json({ starred: isStarred });
  } catch (error: Error & { status?: number }) {
    console.error(`Error checking if gist is starred:`, error);
    return NextResponse.json(
      { error: "Failed to check if gist is starred" },
      { status: 500 }
    );
  }
}

// PUT /api/gists/:id/star - Star a gist
export async function PUT(req: NextRequest, context: any) {
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

    // Create GitHub client with user token or default token
    const github = createGitHubClient(user?.githubToken);

    // Star gist
    await github.starGist(id);

    return NextResponse.json({ success: true });
  } catch (error: Error & { status?: number }) {
    console.error(`Error starring gist:`, error);
    return NextResponse.json({ error: "Failed to star gist" }, { status: 500 });
  }
}

// DELETE /api/gists/:id/star - Unstar a gist
export async function DELETE(req: NextRequest, context: any) {
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

    // Create GitHub client with user token or default token
    const github = createGitHubClient(user?.githubToken);

    // Unstar gist
    await github.unstarGist(id);

    return NextResponse.json({ success: true });
  } catch (error: Error & { status?: number }) {
    console.error(`Error unstarring gist:`, error);
    return NextResponse.json(
      { error: "Failed to unstar gist" },
      { status: 500 }
    );
  }
}
