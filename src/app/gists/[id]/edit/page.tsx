import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { createGitHubClient } from "@/lib/github";
import { EditGistForm } from "./EditGistForm";

export default async function EditGistPage({
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
    redirect("/profile?message=Please add your GitHub token to edit gists");
  }

  // Create GitHub client
  const github = createGitHubClient(user.githubToken);

  try {
    // Fetch the gist
    const gist = await github.getGist(id);

    // Check if user is the owner of this gist
    if (gist.owner.login !== session.user?.name) {
      redirect(`/gists/${id}?message=You can only edit your own gists`);
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Gist</h1>
        <EditGistForm gist={gist} />
      </div>
    );
  } catch (error: any) {
    console.error("Error fetching gist for editing:", error);

    if (error.status === 404) {
      redirect("/gists?message=Gist not found");
    }

    redirect("/gists?message=Failed to load gist for editing");
  }
}
