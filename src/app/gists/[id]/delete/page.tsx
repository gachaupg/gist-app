import DeleteGistClient from "./DeleteGistClient";

export default function DeleteGistPage({ params }: { params: { id: string } }) {
  return <DeleteGistClient id={params.id} />;
}
