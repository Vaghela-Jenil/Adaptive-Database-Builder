import { Toaster } from "@/components/ui/sonner";
import DarkHero from "@/components/landingPage/DarkHero";
import LightFeatures from "@/components/landingPage/LightFeatures";
import LightHowItWorks from "@/components/landingPage/LightHowItWorks";
import LightUseCases from "@/components/landingPage/LightUseCases";
import LightIntegrations from "@/components/landingPage/LightIntegrations";
import LightTrust from "@/components/landingPage/LightTrust";
import LightFAQ from "@/components/landingPage/LightFAQ";
import LightCTA from "@/components/landingPage/LightCTA";

export default function LandingPage() {

  return (
      <div className="relative z-10">
        <DarkHero/>
        <LightFeatures />
        <LightHowItWorks />
        <LightUseCases />
        <LightIntegrations />
        <LightTrust />
        <LightFAQ />
        <LightCTA />
      </div>
  );
}