"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define interfaces for gist data
interface GistFile {
  filename?: string;
  content?: string;
}

interface Gist {
  id: string;
  description: string;
  files: Record<string, GistFile>;
  created_at: string;
  updated_at: string;
  public: boolean;
}

interface ApiError extends Error {
  message: string;
}

export default function DeleteGistPage({ params }: { params: { id: string } }) {
  // Using status only from useSession since data is unused
  const { status } = useSession();
  const router = useRouter();
  const [gist, setGist] = useState<Gist | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const data = await response.json();
        setGist(data);
      } catch (err) {
        console.error("Error fetching gist:", err);
        setError("Failed to load gist information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [params.id, status]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/gists/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete gist");
      }

      // Redirect to gists page on success
      router.push("/gists");
      router.refresh();
    } catch (err: ApiError) {
      console.error("Error deleting gist:", err);
      setError(err.message || "Failed to delete gist. Please try again.");
      setDeleting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
          Gist not found
        </div>
        <Link href="/gists" className="text-indigo-600 hover:text-indigo-800">
          Back to Gists
        </Link>
      </div>
    );
  }

  // Get the filename from the first file
  const filename = Object.keys(gist.files)[0];

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Delete Gist</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this gist?
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-gray-800">{filename}</p>
              {gist.description && (
                <p className="text-gray-600 text-sm mt-1">{gist.description}</p>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-2">
              This action cannot be undone.
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
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Gist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
