
import { LandingHeroSection } from "@/components/landing-hero-section";
import { LandingShortcutsSection } from "@/components/landing-shortcuts-section";
import { LandingAdvantagesSection } from "@/components/landing-advantages-section";
import { LandingFeaturedModelsSection } from "@/components/landing-featured-models-section";
import { LandingCheckoutPlansSection } from "@/components/landing-checkout-plans-section";

// Map keys to actual components
export const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: LandingHeroSection,
  shortcuts: LandingShortcutsSection,
  advantages: LandingAdvantagesSection,
  featured: LandingFeaturedModelsSection,
  plans: LandingCheckoutPlansSection,
};
