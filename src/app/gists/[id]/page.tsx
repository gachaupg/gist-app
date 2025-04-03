import GistClient from "./GistClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Gist - GitHub Gists",
  description: "View the details of a GitHub Gist",
};

export default function GistPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-6">
      <GistClient id={params.id} />
    </div>
  );
}
