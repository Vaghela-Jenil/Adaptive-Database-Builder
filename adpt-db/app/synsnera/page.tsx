import { Toaster } from "@/components/ui/sonner";
// import AnimatedBackground from "@/components/landingPage/AnimatedBackground";
import DarkHero from "@/components/landingPage/DarkHero";
import DarkFeatures from "@/components/landingPage/DarkFeature";
import DarkHowItWorks from "@/components/landingPage/DarkHowItWorks";
import DarkDemoPreview from "@/components/landingPage/DarkDemoPreview";
import DarkUseCases from "@/components/landingPage/DarkUseCases";
import DarkIntegrations from "@/components/landingPage/DarkIntegration";
import DarkTrust from "@/components/landingPage/DarkTrust";
import DarkTestimonials from "@/components/landingPage/DarkTestimonials";
import DarkFAQ from "@/components/landingPage/DarkFAQ";
import DarkCTA from "@/components/landingPage/DarkCTA";

export default function LandingPage() {

  return (
      <div className="relative z-10">
        <DarkHero/>
        <DarkFeatures />
        <DarkHowItWorks />
        <DarkDemoPreview />
        <DarkUseCases />
        <DarkIntegrations />
        <DarkTrust />
        <DarkTestimonials />
        <DarkFAQ />
        <DarkCTA />
      </div>
  );
}