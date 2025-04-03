"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gistSchema } from "@/lib/validations";

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
    } catch (err: any) {
      console.error("Error creating gist:", err);
      setError(err.message || "Failed to create gist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-800">Create Gist</h1>
        <Link
          href="/gists"
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
        >
          Back to Gists
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmit as SubmitHandler<GistFormValues>)}
          className="p-5 space-y-4"
        >
          <div>
            <label
              htmlFor="filename"
              className="block mb-1 text-xs font-medium text-gray-700"
            >
              Filename <span className="text-red-500">*</span>
            </label>
            <input
              id="filename"
              type="text"
              className={`w-full px-3 py-1.5 text-sm border rounded-md ${
                errors.filename ? "border-red-400" : "border-gray-200"
              } focus:outline-none focus:ring-1 focus:ring-indigo-400`}
              placeholder="example.js"
              {...register("filename")}
              disabled={isLoading}
            />
            {errors.filename && (
              <p className="mt-1 text-xs text-red-500">
                {errors.filename.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block mb-1 text-xs font-medium text-gray-700"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              className={`w-full px-3 py-1.5 text-sm border rounded-md ${
                errors.description ? "border-red-400" : "border-gray-200"
              } focus:outline-none focus:ring-1 focus:ring-indigo-400`}
              placeholder="What's this gist about?"
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="block mb-1 text-xs font-medium text-gray-700"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              rows={12}
              className={`w-full px-3 py-1.5 text-sm border rounded-md font-mono ${
                errors.content ? "border-red-400" : "border-gray-200"
              } focus:outline-none focus:ring-1 focus:ring-indigo-400`}
              placeholder="// Enter your code here"
              {...register("content")}
              disabled={isLoading}
            ></textarea>
            {errors.content && (
              <p className="mt-1 text-xs text-red-500">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="public"
              type="checkbox"
              className="h-3.5 w-3.5 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400"
              {...register("public")}
              disabled={isLoading}
            />
            <label
              htmlFor="public"
              className="ml-2 block text-xs text-gray-700"
            >
              Make this gist public
            </label>
            <p className="ml-3 text-xs text-gray-400">
              Public gists can be seen by anyone
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Link
              href="/gists"
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 transition-colors duration-200 shadow-sm disabled:opacity-50"
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
