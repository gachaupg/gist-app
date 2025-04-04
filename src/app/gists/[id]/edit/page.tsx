"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { EditGistForm } from "./EditGistForm";
import Link from "next/link";

export default function EditGistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gist, setGist] = useState<any>(null);
  const [hasToken, setHasToken] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch gist data for editing
  useEffect(() => {
    const fetchGist = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);

        const response = await fetch(`/api/gists/${id}`);

        if (!response.ok) {
          const errorData = await response.json();

          if (
            errorData.error &&
            errorData.error.includes("GitHub token not found")
          ) {
            setHasToken(false);
            return;
          }

          if (response.status === 404) {
            router.push("/gists?message=Gist not found");
            return;
          }

          throw new Error(errorData.error || "Failed to load gist");
        }

        const data = await response.json();

        // Check if user is the owner of the gist
        if (data.owner.login !== session?.user?.name) {
          router.push(`/gists/${id}?message=You can only edit your own gists`);
          return;
        }

        setGist(data);
      } catch (err: any) {
        console.error("Error fetching gist for editing:", err);
        setError(err.message || "Failed to load gist for editing");
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [id, status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Show GitHub token missing message
  if (!hasToken) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Edit Gist</h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                GitHub Token Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to add your GitHub Personal Access Token to edit
                  gists.
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Edit Gist</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
          <Link
            href="/gists"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ← Back to My Gists
          </Link>
        </div>
      </div>
    );
  }

  if (!gist) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Edit Gist</h1>
      <EditGistForm gist={gist} />
    </div>
  );
}
