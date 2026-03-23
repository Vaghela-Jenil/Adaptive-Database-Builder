'use client';
import { useState } from "react";
import LandingPage from "./synsnera/page";
import LightFeatures from "@/components/landingPage/LightFeatures";
import LightTrust from "@/components/landingPage/LightTrust";
import LightFAQ from "@/components/landingPage/LightFAQ";
import LightNavigation from "@/components/landingPage/LightNavigation";
import LightFooter from "@/components/landingPage/LightFooter";
import { Toaster } from "@/components/ui/sonner";
import LightIntegrations from "@/components/landingPage/LightIntegrations";

export default function Home() {

  const [activePage, setActivePage] = useState("Home");

  const renderPage = () => {
      switch (activePage) {
        case "Home":
          return <LandingPage />;
        case "Features":
          return <LightFeatures />;
        case "Security":
          return <LightTrust />;
        case "Tools":
          return <LightIntegrations />;
        case "FAQ":
          return <LightFAQ />;
        default:
          return <LandingPage/>
      }
    };

  return (
    <div className="w-full min-h-screen bg-white relative">
      <LightNavigation activePanel={activePage} setActivePanel={setActivePage}/>
      {renderPage()}
      <LightFooter />
      <Toaster/>
    </div>
  );
}
