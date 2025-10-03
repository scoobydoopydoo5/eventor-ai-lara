import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";
type ThemeColor = "purple" | "blue" | "green" | "orange" | "pink";

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "dark";
  });

  const [color, setColor] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem("theme-color");
    return (saved as ThemeColor) || "purple";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark");
    root.classList.remove(
      "theme-blue",
      "theme-green",
      "theme-orange",
      "theme-pink"
    );

    // Add current theme classes
    root.classList.add(mode);
    if (color !== "purple") {
      root.classList.add(`theme-${color}`);
    }

    // Save to localStorage
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-color", color);
  }, [mode, color]);

  return (
    <ThemeContext.Provider value={{ mode, color, setMode, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
