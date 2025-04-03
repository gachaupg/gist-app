import GistClient from "./GistClient";

export default function GistPage({ params }: { params: { id: string } }) {
  return <GistClient id={params.id} />;
}
