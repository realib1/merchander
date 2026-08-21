import Script from "next/script";

export const ThemeScript = () => {
  const scriptContent = `
    (function() {
      try {
        var theme = localStorage.getItem("merchander-theme");
        var resolved = theme;
        if (!theme) {
          theme = "system";
          resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        if (theme === "system") {
          resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        var root = document.documentElement;
        if (resolved === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      } catch (e) {}
    })();
  `;
  return <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: scriptContent }} />;
};
