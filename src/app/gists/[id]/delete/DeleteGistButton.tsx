"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteGistButtonProps {
  id: string;
}

export default function DeleteGistButton({ id }: DeleteGistButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/gists/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete gist");
      }

      // Redirect to gists page on success
      router.push("/gists?message=Gist successfully deleted");
      router.refresh();
    } catch (err: any) {
      console.error("Error deleting gist:", err);
      setError(err.message || "Failed to delete gist. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete Gist"}
      </button>
    </>
  );
}
