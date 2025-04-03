"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gistSchema } from "@/lib/validations";

// Define error interface
interface ApiError extends Error {
  message: string;
}

type GistFormValues = {
  filename: string;
  description: string;
  content: string;
  public: boolean;
};

export default function NewGistPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GistFormValues>({
    resolver: zodResolver(gistSchema),
    defaultValues: {
      filename: "",
      description: "",
      content: "",
      public: true,
    },
  });

  const onSubmit = async (data: GistFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/gists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create gist");
      }

      // Redirect to the gists page on success
      router.push("/gists");
      router.refresh();
    } catch (err: ApiError) {
      console.error("Error creating gist:", err);
      setError(err.message || "Failed to create gist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Gist</h1>
        <Link
          href="/gists"
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back to Gists
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmit as SubmitHandler<GistFormValues>)}
          className="p-6 space-y-6"
        >
          <div>
            <label
              htmlFor="filename"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Filename <span className="text-red-500">*</span>
            </label>
            <input
              id="filename"
              type="text"
              className={`w-full p-2 border rounded-md ${
                errors.filename ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="example.js"
              {...register("filename")}
              disabled={isLoading}
            />
            {errors.filename && (
              <p className="mt-1 text-sm text-red-600">
                {errors.filename.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              className={`w-full p-2 border rounded-md ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="What's this gist about?"
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              rows={15}
              className={`w-full p-2 border rounded-md font-mono ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="// Enter your code here"
              {...register("content")}
              disabled={isLoading}
            ></textarea>
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="public"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              {...register("public")}
              disabled={isLoading}
            />
            <label
              htmlFor="public"
              className="ml-2 block text-sm text-gray-700"
            >
              Make this gist public
            </label>
            <p className="ml-4 text-xs text-gray-500">
              Public gists can be seen by anyone
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/gists"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Gist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
