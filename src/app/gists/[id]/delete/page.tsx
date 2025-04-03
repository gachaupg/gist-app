import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { createGitHubClient } from "@/lib/github";
import DeleteGistButton from "./DeleteGistButton";

export default async function DeleteGistPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Connect to database
  await dbConnect();

  // Get user's GitHub token
  const user = await User.findById(session.user?.id).select("githubToken");

  if (!user?.githubToken) {
    redirect("/profile?message=Please add your GitHub token to delete gists");
  }

  // Create GitHub client
  const github = createGitHubClient(user.githubToken);

  try {
    // Fetch the gist
    const gist = await github.getGist(id);

    // Check if user is the owner of this gist
    if (gist.owner.login !== session.user?.name) {
      redirect(`/gists/${id}?message=You can only delete your own gists`);
    }

    // Get the first file name for display
    const firstFilename = Object.keys(gist.files)[0];

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Delete Gist</h1>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this gist?
            </p>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="font-medium">{firstFilename}</p>
              <p className="text-sm text-gray-600 mt-1">
                {gist.description || "No description"}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <a
              href={`/gists/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </a>
            <DeleteGistButton id={id} />
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("Error fetching gist for deletion:", error);

    if (error.status === 404) {
      redirect("/gists?message=Gist not found");
    }

    redirect("/gists?message=Failed to load gist for deletion");
  }
}
