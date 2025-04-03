import EditGistClient from "./EditGistClient";

export default function EditGistPage({ params }: { params: { id: string } }) {
  return <EditGistClient id={params.id} />;
}
