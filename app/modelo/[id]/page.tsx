
import { ModelProfile } from "@/components/model-profile";

export default async function ModelProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModelProfile profileId={id} />;
}
