import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user?.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const { githubToken } = body;

    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token is required" },
        { status: 400 }
      );
    }

    // Validate the token by making a request to GitHub API
    try {
      const github = new GitHubClient(githubToken);
      await github.listGists(1, 1); // Test the token with a minimal request
    } catch (err: any) {
      console.error("GitHub token validation error:", err);
      return NextResponse.json(
        {
          error: "Invalid GitHub token. Please check your token and try again.",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update user with new GitHub token
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { githubToken } },
      { new: true }
    ).select("-password -githubToken");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating GitHub token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
