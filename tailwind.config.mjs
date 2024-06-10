import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      minHeight: {
        40.5: "10.375rem",
      },
      screens: {
        s8: { max: "360px" }, // Custom breakpoint for Samsung Galaxy S8
        sm: { max: "640px" }, // Default breakpoint
        md: { max: "768px" }, // Default breakpoint
        lg: { max: "1024px" }, // Default breakpoint
        xl: { max: "1280px" }, // Default breakpoint
        "2xl": { max: "1536px" }, // Default breakpoint
      },
      colors: {
        gray: colors.neutral,
        "blue-btn": "#0a66c2",
        app: "var(--app)",
        "--base-100": "var(--app)",
        "section-divider": "var(--section-divider)",
        "green-1000": "#12853b",
        "primary-light": "var(--primary-light)",
        "blurry-text": "var(--blurry-text)",
        highlight: "var(--highlight)",
        "highlighted-btn-txt": "var(--highlighted-btn-txt)",
        "light-border": "var(--light-border)",
        "list-title": "var(--list-title)",
        "list-date": "var(--list-date)",
        "list-border": "var(--list-border)",
        "list-border-hover": "var(--list-border-hover)",
        "mobile-nav-btn-content": "var(--mobile-nav-btn-content)",
        "mobile-nav-btn": "var(--mobile-nav-btn)",
        "mobile-nav-btn-border": "var(--mobile-nav-btn-border)",
        "mobile-nav-pane-bg": "var(--mobile-nav-pane-bg)",
      },
      boxShadow: {
        "card-box-shadow": "var(--card-box-shadow)",
        "mobile-nav-btn-shadow": "var(--mobile-nav-btn-shadow)",
      },
      fontFamily: {
        sans: ["Inter"].concat(defaultTheme.fontFamily.sans),
        mono: ["Roboto Mono"].concat(defaultTheme.fontFamily.mono),
        inter: ["Inter"].concat(defaultTheme.fontFamily.sans),
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "--app": "#ffffff",
          primary: "#28282B",
          secondary: "#1f2937",
          neutral: "#f3f4f6",
          accent: "#12853b",
          "base-100": "#ffffff",
          "--blurry-text": "#000000",
          "--light-border": "#e5e5e5",
          "--primary-light": "#404040",
          "--highlight": "#e5e7eb",
          "--highlighted-btn-txt": "#404040",
          "--list-border": "#e5e5e5",
          "--list-border-hover": "#a3a3a3",
          "--list-title": "#525252",
          "--list-date": "#26262699",
          "base-content": "#171717",
          "--green-1000": "#12853b",
          "--card-box-shadow": "0 0 8px rgba(0,0,0,0.06)",
          "--mobile-nav-btn-content": "#404040",
          "--mobile-nav-btn": "#ffffffb3",
          "--mobile-nav-btn-border": "#d4d4d4",
          "--mobile-nav-btn-shadow": "0 0 20px rgba(0,0,0,0.1)",
          "--section-divider": "#e5e7eb",
          "--mobile-nav-pane-bg": "#ffffffe6",
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["business"],
          "--app": "#171717",
          primary: "#ffffff",
          secondary: "#a3a3a3",
          "--primary-light": "#d4d4d4cc",
          "--blurry-text": "#e5e5e5",
          "--gray-900": "#171717",
          "base-100": "#171717",
          "base-content": "#ffffff",
          "--highlight": "#404040",
          "--highlighted-btn-txt": "#d4d4d4",
          // accent: "#1eb854",
          accent: "#12853b",
          "--green-1000": "#12853b",
          "--light-border": "#404040b3",
          "--card-box-shadow": "0 0 8px rgba(0,0,0,0.5)",
          "--list-border": "#404040",
          "--list-border-hover": "#737373",
          "--list-date": "#ffffff66",
          "--list-title": "#a3a3a3",
          "--mobile-nav-btn-content": "#e5e5e5",
          "--mobile-nav-btn": "#171717",
          "--mobile-nav-btn-border": "#404040",
          "--mobile-nav-btn-shadow": "0 0 20px rgba(0,0,0,0.7)",
          "--section-divider": "#1f2937",
          "--mobile-nav-pane-bg": "#171717e6",
        },
      },
    ],
    extend: {
      light: {
        boxShadow: {
          "custom-light": "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
        backgroundColor: {
          "xyz-200": "#e5e7eb",
        },
      },
      dark: {
        boxShadow: {
          "custom-dark": "0 4px 6px rgba(255, 255, 255, 0.1)",
        },
        backgroundColor: {
          "xyz-200": "#1f2937",
        },
      },
    },
    variants: {
      extend: {
        backgroundColor: ["dark"],
        textColor: ["dark"],
      },
    },
    // darkTheme: "customDarkTheme",
    // lightTheme: "cupcake",
  },
};
