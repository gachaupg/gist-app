import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate user input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.format() },
        { status: 400 }
      );
    }

    // Extract validated data
    const { name, email, password } = result.data;

    // Connect to database
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create a new user
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by User model pre-save hook
    });

    // Respond with user data (excluding password)
    return NextResponse.json(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
