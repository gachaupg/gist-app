"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

// Edit gist schema
const editGistSchema = z.object({
  filename: z.string().min(1, { message: "Filename is required" }),
  description: z.string().optional(),
  content: z.string().min(1, { message: "Content is required" }),
  public: z.boolean(),
});

type EditGistFormValues = z.infer<typeof editGistSchema>;

export default function EditGistPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilename, setCurrentFilename] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditGistFormValues>({
    resolver: zodResolver(editGistSchema),
    defaultValues: {
      filename: "",
      description: "",
      content: "",
      public: true,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch gist data
  useEffect(() => {
    const fetchGist = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch(`/api/gists/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch gist");
        }

        const gist = await response.json();

        // Get the first (or only) file
        const firstFilename = Object.keys(gist.files)[0];
        const firstFile = gist.files[firstFilename];

        setCurrentFilename(firstFilename);

        // Set form values
        reset({
          filename: firstFilename,
          description: gist.description || "",
          content: firstFile.content || "",
          public: gist.public,
        });
      } catch (error) {
        console.error("Error fetching gist:", error);
        setError("Failed to load gist. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGist();
  }, [params.id, reset, status]);

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

      const response = await fetch(`/api/gists/${params.id}`, {
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
      router.push(`/gists/${params.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error updating gist:", err);
      setError(err.message || "Failed to update gist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || (isLoading && !error)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Gist</h1>
        <Link
          href={`/gists/${params.id}`}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
              href={`/gists/${params.id}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Gist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
