import type { Config } from "tailwindcss";

export default {
  important: true,
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './ui/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Tailwind v4 automatically picks up @theme variables
      // No need for manual mapping when using @theme directive
    },
  },
  plugins: [],
} satisfies Config;
