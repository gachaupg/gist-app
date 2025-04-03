"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { debounce } from "lodash";

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

export default function SearchContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim()) {
        performSearch(query);

        // Update URL with search query
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", query);
        router.replace(`/gists/search?${params.toString()}`);
      }
    }, 500),
    [searchParams]
  );

  // Initial search on load if query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Trigger debounced search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setGists([]);

      // Update URL to remove query
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      router.replace(`/gists/search?${params.toString()}`);
    }
  }, [searchQuery, debouncedSearch, searchParams, router]);

  // Perform search
  const performSearch = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/public-gists/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const searchResults = await response.json();
      filterGistsByTab(activeTab, searchResults);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search gists. Please try again.");
      setGists([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter gists by tab
  const filterGistsByTab = (tab: "all" | "my", gistsToFilter: Gist[]) => {
    if (tab === "all" || !session?.user?.name) {
      setGists(gistsToFilter);
    } else {
      setGists(
        gistsToFilter.filter((gist) => gist.owner.login === session.user?.name)
      );
    }
  };

  // Handle tab change
  const handleTabChange = (tab: "all" | "my") => {
    setActiveTab(tab);
    filterGistsByTab(tab, gists);
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

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/gists"
          className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
        >
          ← Back to Gists
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Search Gists</h1>
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
              placeholder="Search by filename, description, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              autoFocus
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
              All Results
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
              My Results
            </button>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Search results */}
      {!loading && searchQuery.trim() !== "" && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            {gists.length === 0
              ? "No gists found matching your search"
              : `Found ${gists.length} gist${gists.length === 1 ? "" : "s"}`}
          </p>
        </div>
      )}

      {gists.length === 0 && !loading ? (
        searchQuery.trim() !== "" ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 mb-2">
              No gists found matching your search
            </p>
            <p className="text-sm text-gray-400">
              Try different keywords or filters
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500">Enter a search term to find gists</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gists.map((gist) => {
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
      )}
    </div>
  );
} 