'use client';
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { cn } from '@/lib/utils';
import ThemeToggle from "@/components/theme-toggle";
import { useTheme } from "../provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { theme, toggleTheme } = useTheme();

  return (
    <div>
        <StarsBackground
          starColor={theme === 'dark' ? '#FFF' : '#000'}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-xl',
            'dark:bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)] bg-[radial-gradient(ellipse_at_bottom,_#f5f5f5_0%,_#fff_100%)]',
          )}
        />
        <div className="fixed right-3 flex justify-end mr-3 mt-3 ">
          <ThemeToggle />
        </div>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          {children}
        </div>
        </div>
  );
}
