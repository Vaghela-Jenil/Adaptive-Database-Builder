"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserProvider } from "@/context/userContext";
import { AuthLogger } from "@/components/AuthLogger";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  // Persist theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ClerkProvider
        signInUrl="/login"
        signUpUrl="/signup"
        afterSignOutUrl="/"
        afterSignInUrl="/redirect"
        afterSignUpUrl="/redirect"
        appearance={{
          baseTheme: theme === "dark" ? dark : undefined,
        }}
      >
        <UserProvider>
          <AuthLogger />
          {children}
        </UserProvider>
      </ClerkProvider>
    </ThemeContext.Provider>
  );
}
