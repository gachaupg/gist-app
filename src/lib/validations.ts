import { z } from "zod";

// Registration form schema
export const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Login form schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Profile update schema
export const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().optional(),
});

// Gist creation schema
export const gistSchema = z.object({
  filename: z.string().min(1, { message: "Filename is required" }),
  description: z.string().optional(),
  content: z.string().min(1, { message: "Content is required" }),
  public: z.boolean().default(true),
});

// GitHub token schema
export const githubTokenSchema = z.object({
  token: z.string().min(1, { message: "GitHub token is required" }),
});
