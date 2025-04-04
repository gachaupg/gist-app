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

export default function GistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);

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
      if (isSearching) return; // Skip this effect if we're in search mode

      try {
        if (page === 1) {
          setLoading(true);
        } else {
          // Only show loading indicator for additional pages
          setHasMore(true);
        }

        const response = await fetch(`/api/gists?page=${page}&per_page=4`);

        if (!response.ok) {
          const errorData = await response.json();
          if (
            errorData.error &&
            errorData.error.includes("GitHub token not found")
          ) {
            // Set hasToken to false to show token missing message
            setHasToken(false);
            setLoading(false);
            return;
          }

          if (
            errorData.error &&
            errorData.error.includes("Invalid GitHub token")
          ) {
            // Token is invalid
            setHasToken(false);
            setError(errorData.error);
            setLoading(false);
            return;
          }

          throw new Error(errorData.error || "Failed to fetch gists");
        }

        const data = await response.json();

        // If we got fewer items than requested, there are no more pages
        if (data.length < 4) {
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
  }, [page, status, router, isSearching]);

  // Effect for search with pagination
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!isSearching || !searchTerm.trim()) return;

      try {
        setLoading(searchPage === 1);

        const response = await fetch(
          `/api/gists/search?q=${encodeURIComponent(
            searchTerm
          )}&page=${searchPage}&per_page=4`
        );

        if (!response.ok) {
          const errorData = await response.json();
          if (
            errorData.error &&
            errorData.error.includes("GitHub token not found")
          ) {
            // Set hasToken to false to show token missing message
            setHasToken(false);
            setLoading(false);
            return;
          }

          throw new Error(errorData.error || "Search failed");
        }

        const data = await response.json();

        // Check if we have more results
        if (data.length < 4) {
          setSearchHasMore(false);
        } else {
          setSearchHasMore(true);
        }

        // Update gists array based on the page
        if (searchPage === 1) {
          setGists(data);
        } else {
          setGists((prevGists) => [...prevGists, ...data]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [isSearching, searchTerm, searchPage]);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      // If search is empty, reset to first page of all gists
      setIsSearching(false);
      setPage(1);
      setHasMore(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set search mode and reset search page
      setIsSearching(true);
      setSearchPage(1);

      // Initial search is handled by the useEffect that watches searchPage
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
      setLoading(false);
    }
  };

  // Handle reset search
  const handleResetSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setPage(1);
    setHasMore(true);
  };

  // Handle load more based on current mode
  const handleLoadMore = () => {
    if (isSearching) {
      setSearchPage((prev) => prev + 1);
    } else {
      setPage((prev) => prev + 1);
    }
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
    } catch (err: any) {
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
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show GitHub token missing message
  if (!hasToken) {
    return (
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-800 mb-3 md:mb-0">
            My Gists
          </h1>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                GitHub Token Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to add your GitHub Personal Access Token to view and
                  manage your gists. This token is required to authenticate with
                  GitHub's API and access your personal gists.
                </p>
                <p className="mt-2">
                  <strong>Important:</strong> The token should have the{" "}
                  <code className="bg-yellow-100 px-1 py-0.5 rounded">
                    gist
                  </code>{" "}
                  scope enabled.
                </p>
                <div className="mt-4">
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Go to Profile Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            How to Create a GitHub Personal Access Token
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to your GitHub account settings</li>
            <li>Click on "Developer settings" in the sidebar</li>
            <li>Select "Personal access tokens" and then "Tokens (classic)"</li>
            <li>Click "Generate new token" and confirm your password</li>
            <li>Give your token a description (e.g., "Gist Tracker App")</li>
            <li>
              Select the <strong>gist</strong> scope
            </li>
            <li>Click "Generate token" at the bottom of the page</li>
            <li>Copy the generated token (you'll only see it once!)</li>
            <li>Paste the token in your profile settings</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-800 mb-3 md:mb-0">
          My Gists
        </h1>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/gists/new"
            className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 transition-colors duration-200 shadow-sm text-center"
          >
            Create Gist
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your gists by description or filename..."
            className="flex-grow px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors duration-200 shadow-sm"
            disabled={loading}
          >
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors duration-200 shadow-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Gists List */}
      {loading && (page === 1 || searchPage === 1) ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : gists.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 mb-3">
            {isSearching
              ? "No gists found matching your search"
              : "You don't have any gists yet"}
          </p>
          {!isSearching && (
            <Link
              href="/gists/new"
              className="inline-flex items-center px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 transition-colors duration-200 shadow-sm"
            >
              Create Your First Gist
            </Link>
          )}
          {isSearching && (
            <button
              onClick={handleResetSearch}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors duration-200 shadow-sm"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {gists.map((gist) => {
              // Get the first file from the gist
              const fileName = Object.keys(gist.files)[0];
              const file = gist.files[fileName];

              return (
                <div
                  key={gist.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <img
                          src={gist.owner.avatar_url}
                          alt={gist.owner.login}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-sm font-medium text-indigo-600">
                          {gist.owner.login}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(gist.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/gists/${gist.id}`}
                      className="text-base font-medium text-gray-800 hover:text-indigo-600 mb-2 block truncate"
                    >
                      {fileName}
                    </Link>

                    {gist.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {gist.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {file.language || "Plain Text"}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {gist.public ? "Public Gist" : "Private Gist"}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/gists/${gist.id}/edit`}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(gist.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  {deleteId === gist.id && (
                    <div className="p-4 bg-red-50 border-t border-red-100">
                      <p className="text-sm text-red-700 mb-2">
                        Are you sure you want to delete this gist?
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(gist.id)}
                          disabled={isDeleting}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-400 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-md hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {((isSearching && searchHasMore) || (!isSearching && hasMore)) && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-indigo-500 mr-2 rounded-full"></span>
                    Loading...
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
