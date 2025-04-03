import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";

const avatarSchema = z.object({
  avatar: z.string().nonempty("Avatar is required"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is authorized to update this profile
    if (session.user?.id !== params.id) {
      return NextResponse.json(
        { error: "You can only update your own avatar" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const result = avatarSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user and update
    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the avatar
    user.avatar = result.data.avatar;
    await user.save();

    return NextResponse.json(
      { message: "Avatar updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
