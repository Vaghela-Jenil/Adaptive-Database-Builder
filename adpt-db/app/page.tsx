'use client';
import { useState } from "react";
import LandingPage from "./synsnera/page";
import DarkUseCases from "@/components/landingPage/DarkUseCases";
import DarkTrust from "@/components/landingPage/DarkTrust";
import DarkIntegrations from "@/components/landingPage/DarkIntegration";
import DarkTestimonials from "@/components/landingPage/DarkTestimonials";
import DarkFeatures from "@/components/landingPage/DarkFeature";
import DarkFAQ from "@/components/landingPage/DarkFAQ";
import DarkNavigation from "@/components/landingPage/DarkNavigation";
import DarkFooter from "@/components/landingPage/DarkFooter";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {

  const [activePage, setActivePage] = useState("Home");

  const renderPage = () => {
      switch (activePage) {
        case "Home":
          return <LandingPage />;
        case "Use Cases":
          return <DarkUseCases />;
        case "Features":
          return <DarkFeatures />;
        case "Security":
          return <DarkTrust />;
        case "Tools":
          return <DarkIntegrations />;
          // case "Reviews":
          // return <DarkTestimonials />;
          case "Q&A":
          return <DarkFAQ />;
        default:
          return <LandingPage/>
      }
    };

  return (
    <div className="w-full min-h-screen bg-slate-950 relative">
      <DarkNavigation activePanel={activePage} setActivePanel={setActivePage}/>
      {renderPage()}
      <DarkFooter />
      <Toaster/>
    </div>
  );
}
