"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GistFile {
  filename: string;
  language: string;
  raw_url: string;
  size: number;
  type: string;
  content?: string;
}

interface Gist {
  id: string;
  description: string;
  created_at: string;
  updated_at: string;
  public: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  files: {
    [key: string]: GistFile;
  };
  html_url: string;
}

// Add ApiError interface
interface ApiError extends Error {
  message: string;
}

export default function GistsPage() {
  // Using only status since session data is unused
  const { status } = useSession();
  const router = useRouter();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch gists
  useEffect(() => {
    const fetchGists = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/gists?page=${page}&per_page=10`);

        if (!response.ok) {
          const errorData = await response.json();
          if (
            errorData.error &&
            errorData.error.includes("GitHub token not found")
          ) {
            // Redirect to profile page if GitHub token is missing
            setError("GitHub token not found. Redirecting to profile page...");
            setTimeout(() => {
              router.push("/profile");
            }, 2000);
            return;
          }
          throw new Error(errorData.error || "Failed to fetch gists");
        }

        const data = await response.json();

        // If we got fewer items than requested, there are no more pages
        if (data.length < 10) {
          setHasMore(false);
        }

        if (page === 1) {
          setGists(data);
        } else {
          setGists((prevGists) => [...prevGists, ...data]);
        }
      } catch (err) {
        console.error("Error fetching gists:", err);
        setError("Failed to load gists. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGists();
  }, [page, status, router]);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      // If search is empty, reset to first page of all gists
      setPage(1);
      setHasMore(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/gists/search?q=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (
          errorData.error &&
          errorData.error.includes("GitHub token not found")
        ) {
          // Redirect to profile page if GitHub token is missing
          setError("GitHub token not found. Redirecting to profile page...");
          setTimeout(() => {
            router.push("/profile");
          }, 2000);
          return;
        }
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      setGists(data);
      setHasMore(false); // No pagination for search results
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle reset search
  const handleResetSearch = () => {
    setSearchTerm("");
    setPage(1);
    setHasMore(true);
  };

  // Handle delete gist
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/gists/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete gist");
      }

      // Remove the deleted gist from state
      setGists((prevGists) => prevGists.filter((gist) => gist.id !== id));
      setDeleteId(null);
    } catch (err: ApiError) {
      console.error("Error deleting gist:", err);
      setError(err.message || "Failed to delete gist. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          My Gists
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/gists/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-center"
          >
            Create New Gist
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error.includes("GitHub token not found") ? (
            <>
              {error} You need to add your{" "}
              <Link href="/profile" className="font-medium underline">
                GitHub Personal Access Token
              </Link>{" "}
              to use this feature.
            </>
          ) : (
            error
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gists by description or filename..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Gists List */}
      <div className="space-y-4">
        {loading && page === 1 ? (
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : gists.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-700">
              No gists found
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm
                ? `No gists matching "${searchTerm}"`
                : "You haven't created any gists yet"}
            </p>
            {!searchTerm && (
              <Link
                href="/gists/new"
                className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Your First Gist
              </Link>
            )}
          </div>
        ) : (
          <>
            {gists.map((gist) => (
              <div
                key={gist.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        <Link
                          href={`/gists/${gist.id}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {gist.description ||
                            Object.keys(gist.files)[0] ||
                            "Untitled Gist"}
                        </Link>
                      </h2>
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(gist.created_at)} · Updated:{" "}
                        {formatDate(gist.updated_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/gists/${gist.id}/edit`}
                        className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteId(gist.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Files:
                    </h3>
                    <ul className="space-y-1">
                      {Object.keys(gist.files).map((filename) => (
                        <li key={filename} className="text-sm">
                          <span className="text-gray-800 font-medium">
                            {filename}
                          </span>
                          {gist.files[filename].language && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {gist.files[filename].language}
                            </span>
                          )}
                          <span className="ml-2 text-gray-500">
                            ({gist.files[filename].size} bytes)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {gist.public ? "Public" : "Private"}
                    </span>
                    <a
                      href={gist.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {!searchTerm && gists.length > 0 && (
              <div className="mt-8 flex justify-center">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="mx-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    Previous
                  </button>
                )}
                <span className="mx-2 px-4 py-2 text-gray-700">
                  Page {page}
                </span>
                {hasMore && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="mx-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    Next
                  </button>
                )}
              </div>
            )}

            {/* Loading indicator for pagination */}
            {loading && page > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Delete Gist
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this gist? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
