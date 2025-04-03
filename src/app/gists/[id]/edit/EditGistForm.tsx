"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

// Edit gist schema
const editGistSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  public: z.boolean().default(false),
});

type EditGistFormValues = z.infer<typeof editGistSchema>;

interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  truncated: boolean;
  content: string;
}

interface Gist {
  id: string;
  description: string;
  public: boolean;
  files: Record<string, GistFile>;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface EditGistFormProps {
  gist: Gist;
}

export function EditGistForm({ gist }: EditGistFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the first file from the gist
  const firstFilename = Object.keys(gist.files)[0];
  const firstFile = gist.files[firstFilename];
  const [currentFilename, setCurrentFilename] = useState(firstFilename);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditGistFormValues>({
    resolver: zodResolver(editGistSchema),
    defaultValues: {
      filename: firstFilename,
      description: gist.description || "",
      content: firstFile.content || "",
      public: gist.public,
    },
  });

  const onSubmit = async (data: EditGistFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare files object
      const files: Record<string, { content: string } | null> = {};

      // If filename has changed, mark the old file for deletion and create a new one
      if (data.filename !== currentFilename) {
        files[currentFilename] = null; // Mark for deletion
        files[data.filename] = { content: data.content };
      } else {
        files[data.filename] = { content: data.content };
      }

      const response = await fetch(`/api/gists/${gist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: data.description,
          files,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update gist");
      }

      // Redirect to the gist page on success
      router.push(`/gists/${gist.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error updating gist:", err);
      setError(err.message || "Failed to update gist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
          <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
            Make this gist public
          </label>
          <p className="ml-4 text-xs text-gray-500">
            Public gists can be seen by anyone
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Link
            href={`/gists/${gist.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Gist"}
          </button>
        </div>
      </form>
    </div>
  );
}
