import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "inboxiq-theme";
const DEFAULT_THEME = "light";
const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.add("theme-changing");
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);

    const timeout = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-changing");
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isDark, theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      isLight: !isDark,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      setTheme,
    }),
    [isDark, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
