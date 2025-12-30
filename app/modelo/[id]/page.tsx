
import { ModelProfile } from "@/components/model-profile";

export default function ModelProfilePage({ params }: { params: { id: string } }) {
  return <ModelProfile profileId={params.id} />;
}
