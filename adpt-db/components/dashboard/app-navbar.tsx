"use client";

import { motion } from "motion/react";
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useState } from "react";
import ThemeToggle from "../theme-toggle";

export default function DashboardNavbar() {
  const [notifications] = useState(3);
  const { theme, setTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="
        h-20 px-6 flex items-center
        bg-background/70 backdrop-blur-xl
        border-b border-border
      "
    >
      <div className="flex items-center justify-between w-full gap-6">

        {/* LEFT */}
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search databases, records, folders..."
              className="
                pl-10 h-10 rounded-xl
                bg-muted/40
                focus-visible:ring-1 focus-visible:ring-foreground/20
              "
            />
          </div>

          {/* Primary Action */}
          <Button className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            New Record
          </Button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* Help */}
          <IconButton>
            <HelpCircle className="h-5 w-5" />
          </IconButton>

          {/* Notifications */}
          <IconButton>
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  h-5 w-5 rounded-full
                  bg-foreground text-background
                  text-xs font-semibold
                  flex items-center justify-center
                "
              >
                {notifications}
              </span>
            )}
          </IconButton>

          {/* Theme Toggle */}
          <ThemeToggle/>

          {/* Profile */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              flex items-center gap-3 px-3 py-2
              rounded-xl border border-border
              bg-muted/40 hover:bg-muted
              transition-colors
            "
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="font-semibold">
                JD
              </AvatarFallback>
            </Avatar>

            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

/* -------------------------
   Small reusable icon button
-------------------------- */
function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="
        relative h-10 w-10 rounded-xl
        border border-border
        bg-muted/40 hover:bg-muted
        flex items-center justify-center
        transition-colors
      "
    >
      {children}
    </motion.button>
  );
}
