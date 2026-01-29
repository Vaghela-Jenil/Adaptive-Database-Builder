'use client'
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function PageNotFound() {
  const handleGoBack = () => {
    // In a real app, this would go back in history
    window.history.back();
  };

  const handleSearch = () => {
    // In a real app, this would open search functionality
    console.log("Opening search");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* 404 Number */}
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary/10 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border-2 border-primary/10">
                <Search className="w-10 h-10 text-primary/30" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved to a different location.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            <Link href='/user/dashboard'><span>Back to Home</span></Link>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>

        {/* Helpful Links */}
        {/* <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Maybe try one of these instead:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Home', 'About', 'Services', 'Contact'].map((link) => (
              <Button 
                key={link}
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => console.log(`Navigate to ${link}`)}
              >
                {link}
              </Button>
            ))}
          </div>
        </div> */}

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-2 pt-8">
          <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}



// "use client";

// import { StatusPage } from "@/components/status-page";
// import { Search, Home } from "lucide-react";

// export default function NotFound() {
//   return (
//     <StatusPage
//       code="404"
//       title="Page Not Found"
//       description="The page you're looking for doesn't exist or has been moved."
//       icon={Search}
//       primaryAction={{
//         label: "Back to Dashboard",
//         href: "/user/dashboard",
//         icon: Home,
//       }}
//       secondaryAction={{
//         label: "Go Back",
//         onClick: () => window.history.back(),
//         icon:undefined,
//       }}
//     />
//   );
// }