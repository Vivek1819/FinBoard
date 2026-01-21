"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const isDark = storedTheme === "dark" || storedTheme === null;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Update DOM + localStorage when theme changes
  useEffect(() => {
    if (dark === null) return;

    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  if (dark === null) return null; // avoid hydration mismatch

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-md text-muted hover:text-foreground hover:bg-white/5 transition"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
