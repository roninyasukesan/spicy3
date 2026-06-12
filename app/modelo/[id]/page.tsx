
import { redirect } from "next/navigation";

export default async function ModelProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/busca?perfil=${encodeURIComponent(id)}`);
}
