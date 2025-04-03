"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GistFile {
  filename: string;
  language: string;
  raw_url: string;
  size: number;
  type: string;
  content: string;
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
  starred?: boolean;
}

export default function GistPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gist, setGist] = useState<Gist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [isStarring, setIsStarring] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch gist
  useEffect(() => {
    const fetchGist = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/gists/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch gist");
        }

        const data = await response.json();
        setGist(data);

        // Check if gist is starred
        const starResponse = await fetch(`/api/gists/${params.id}/star`);
        if (starResponse.ok) {
          const starData = await starResponse.json();
          setStarred(starData.starred);
        }
      } catch (err) {
        console.error("Error fetching gist:", err);
        setError("Failed to load gist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [params.id, status]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle star/unstar
  const handleToggleStar = async () => {
    if (!gist) return;

    try {
      setIsStarring(true);
      const method = starred ? "DELETE" : "PUT";
      const response = await fetch(`/api/gists/${gist.id}/star`, {
        method,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${starred ? "unstar" : "star"} gist`);
      }

      setStarred(!starred);
    } catch (err) {
      console.error("Error toggling star:", err);
      setError(
        `Failed to ${starred ? "unstar" : "star"} gist. Please try again.`
      );
    } finally {
      setIsStarring(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/gists" className="text-indigo-600 hover:text-indigo-800">
          Back to Gists
        </Link>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
          Gist not found
        </div>
        <Link href="/gists" className="text-indigo-600 hover:text-indigo-800">
          Back to Gists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/gists"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            ← Back to Gists
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {Object.keys(gist.files)[0]}
          </h1>
          <div className="flex items-center mt-1 text-gray-600 text-sm">
            <span>
              Created {formatDate(gist.created_at)}
              {gist.created_at !== gist.updated_at &&
                ` • Updated ${formatDate(gist.updated_at)}`}
            </span>
          </div>
        </div>

        <div className="flex mt-4 md:mt-0 space-x-2">
          <button
            onClick={handleToggleStar}
            disabled={isStarring}
            className={`px-3 py-1 rounded-md flex items-center ${
              starred
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 mr-1 ${
                starred ? "text-yellow-500" : "text-gray-400"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 1L12.5 6.5L19 7.5L14.5 12L15.5 19L10 15.5L4.5 19L5.5 12L1 7.5L7.5 6.5L10 1Z"
                clipRule="evenodd"
              />
            </svg>
            {starred ? "Starred" : "Star"}
          </button>

          {gist.owner.login === session?.user?.name && (
            <>
              <Link
                href={`/gists/${gist.id}/edit`}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-md"
              >
                Edit
              </Link>
              <Link
                href={`/gists/${gist.id}/delete`}
                className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-md"
              >
                Delete
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {gist.description && (
        <div className="mb-6 bg-gray-50 p-4 rounded-md text-gray-700">
          {gist.description}
        </div>
      )}

      {/* Files */}
      <div className="space-y-6">
        {Object.entries(gist.files).map(([filename, file]) => (
          <div
            key={filename}
            className="bg-white border border-gray-200 rounded-md overflow-hidden"
          >
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
              <div className="font-medium">{filename}</div>
              <div className="text-sm text-gray-500">
                {file.language || "Plain Text"}
              </div>
            </div>
            <pre className="p-4 overflow-x-auto bg-gray-800 text-gray-200 text-sm">
              <code>{file.content}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
