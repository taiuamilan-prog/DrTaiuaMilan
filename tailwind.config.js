/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#E6ECF3",
          100: "#C2CEDD",
          300: "#6C82A0",
          500: "#2A4768",
          700: "#14375E",
          900: "#0A2540",
        },
        teal: {
          50: "#E6F6F4",
          100: "#B6E5E0",
          300: "#5BC5BB",
          500: "#0E9F8E",
          700: "#0A776B",
          900: "#054640",
        },
        gold: {
          50: "#FBF6EA",
          100: "#F1E4BE",
          300: "#DCC07F",
          500: "#C9A961",
          700: "#9C8242",
          900: "#5E4D24",
        },
        ivory: {
          50: "#FAF8F3",
          100: "#F3EFE5",
        },
        slate: {
          700: "#334155",
        },
        alert: {
          red: "#B91C1C",
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 4px 20px -8px rgba(10, 37, 64, 0.15)",
        "soft-lg": "0 12px 40px -12px rgba(10, 37, 64, 0.18)",
      },
      letterSpacing: {
        tightish: "-0.015em",
      },
    },
  },
  plugins: [],
};
