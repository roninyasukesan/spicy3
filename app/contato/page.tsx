import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactSection } from "@/components/contact-section";

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <ContactSection />
      <Footer />
    </div>
  );
}
