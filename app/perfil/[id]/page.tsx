import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProfileDetailsFetched } from "@/components/profile-details-fetched"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <ProfileDetailsFetched profileId={params.id} />
      <Footer />
    </div>
  )
}
