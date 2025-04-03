import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { profileSchema } from "@/lib/validations";
import { authOptions } from "@/lib/auth";

// Helper function to check if user is authenticated and authorized
async function validateUser(req: NextRequest, userId: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

// GET /api/user/[id] - Get user profile
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Validate authentication and authorization
    const authError = await validateUser(req, userId);
    if (authError) return authError;

    await dbConnect();

    const user = await User.findById(userId).select("-password -githubToken");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/user/[id] - Update user profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Validate authentication and authorization
    const authError = await validateUser(req, userId);
    if (authError) return authError;

    // Parse and validate request body
    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update user with validated data
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: result.data },
      { new: true, runValidators: true }
    ).select("-password -githubToken");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Validate authentication and authorization
    const authError = await validateUser(req, userId);
    if (authError) return authError;

    await dbConnect();

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
