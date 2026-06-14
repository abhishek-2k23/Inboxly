"use client";

import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <IconButton
      icon={isDark ? "ti-sun" : "ti-moon"}
      label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
    />
  );
}
