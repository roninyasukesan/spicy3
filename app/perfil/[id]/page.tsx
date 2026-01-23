import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProfileDetailsFetched } from "@/components/profile-details-fetched"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <ProfileDetailsFetched profileId={id} />
      <Footer />
    </div>
  )
}
