"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface GistFile {
  filename: string;
  language: string;
  raw_url: string;
  size: number;
  type: string;
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

export default function Home() {
  const { data: session } = useSession();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGists, setFilteredGists] = useState<Gist[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch gists
  useEffect(() => {
    const fetchGists = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Use the public-gists endpoint instead of the regular gists endpoint
        // This will work without requiring a GitHub token
        const response = await fetch(
          `/api/public-gists?per_page=4&page=${page}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch gists");
        }

        const data = await response.json();

        // If we received fewer items than requested, there are no more pages
        if (data.length < 4) {
          setHasMore(false);
        }

        // Append new gists if loading more, otherwise replace
        if (page === 1) {
          setGists(data);
          setFilteredGists(data);
        } else {
          setGists((prevGists) => [...prevGists, ...data]);
          setFilteredGists((prevGists) => [...prevGists, ...data]);
        }
      } catch (err: unknown) {
        console.error("Error fetching gists:", err);
        setError("Failed to load gists. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchGists();
  }, [page]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      // If no search query, filter by tab only
      filterGistsByTab(activeTab, gists);
    } else {
      // If there's a search query, first filter by search then by tab
      handleSearch();
    }
  }, [searchQuery, gists, activeTab]);

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      filterGistsByTab(activeTab, gists);
      return;
    }

    try {
      // Use the public-gists search endpoint
      const response = await fetch(
        `/api/public-gists/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const searchResults = await response.json();
      filterGistsByTab(activeTab, searchResults);
      setHasMore(false); // Disable pagination for search results
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search gists. Please try again.");
      filterGistsByTab(activeTab, gists);
    }
  };

  // Filter gists by tab
  const filterGistsByTab = (tab: "all" | "my", gistsToFilter: Gist[]) => {
    if (tab === "all" || !session?.user?.name) {
      setFilteredGists(gistsToFilter);
    } else {
      setFilteredGists(
        gistsToFilter.filter((gist) => gist.owner.login === session.user?.name)
      );
    }
  };

  // Handle tab change
  const handleTabChange = (tab: "all" | "my") => {
    setActiveTab(tab);
    filterGistsByTab(tab, searchQuery.trim() === "" ? gists : filteredGists);
  };

  // Handle load more
  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
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

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Public Gists</h1>
        <Link
          href="/gists/new"
          className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 transition-colors duration-200 shadow-sm"
        >
          Create Gist
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
          {error}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search gists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => handleTabChange("all")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "all"
                  ? "bg-indigo-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Gists
            </button>
            <button
              onClick={() => handleTabChange("my")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "my"
                  ? "bg-indigo-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              disabled={!session}
            >
              My Gists
            </button>
          </div>
        </div>
      </div>

      {filteredGists.length === 0 ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">
            {searchQuery
              ? "No gists found matching your search"
              : activeTab === "my"
              ? "You don't have any gists yet"
              : "No gists found"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGists.map((gist) => {
              const fileName = Object.keys(gist.files)[0];
              const file = gist.files[fileName];
              const isOwnGist = gist.owner.login === session?.user?.name;

              return (
                <Link href={`/gists/${gist.id}`} key={gist.id}>
                  <div
                    className={`border rounded-lg shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 h-full overflow-hidden ${
                      isOwnGist ? "bg-indigo-50" : "bg-white border-gray-100"
                    }`}
                  >
                    <div
                      className={`p-4 border-b ${
                        isOwnGist ? "border-indigo-100" : "border-gray-50"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <img
                          src={gist.owner.avatar_url}
                          alt={gist.owner.login}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <span
                          className={`text-xs font-medium ${
                            isOwnGist ? "text-indigo-600" : "text-indigo-500"
                          }`}
                        >
                          {gist.owner.login} {isOwnGist && "(You)"}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-gray-700 truncate">
                        {fileName}
                      </h3>
                      {gist.description && (
                        <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">
                          {gist.description}
                        </p>
                      )}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex justify-between">
                      <span className="text-xs font-medium">
                        {file.language || "Plain Text"}
                      </span>
                      <span className="text-xs">
                        {formatDate(gist.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && !searchQuery.trim() && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50"
              >
                {loadingMore ? (
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
