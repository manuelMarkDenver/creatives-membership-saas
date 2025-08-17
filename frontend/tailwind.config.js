/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Member status button colors - light mode (maximum contrast - very dark backgrounds with white text)
    'bg-green-800', 'bg-green-900', 'border-green-800', 'border-green-900', 'hover:bg-green-900', 'hover:border-green-900',
    'bg-red-700', 'bg-red-800', 'border-red-700', 'border-red-800', 'hover:bg-red-800', 'hover:border-red-800',
    'bg-yellow-700', 'bg-yellow-800', 'border-yellow-700', 'border-yellow-800', 'hover:bg-yellow-800', 'hover:border-yellow-800',
    'bg-orange-700', 'bg-orange-800', 'border-orange-700', 'border-orange-800', 'hover:bg-orange-800', 'hover:border-orange-800',
    'bg-amber-700', 'bg-amber-800', 'border-amber-700', 'border-amber-800', 'hover:bg-amber-800', 'hover:border-amber-800',
    'bg-slate-700', 'bg-slate-800', 'border-slate-700', 'border-slate-800', 'hover:bg-slate-800', 'hover:border-slate-800',
    'bg-gray-100', 'bg-gray-700', 'border-gray-300', 'border-gray-600', 'text-gray-600', 'text-gray-300', 'text-white', 'text-black',
    // Member status button colors - dark mode (black text on lighter backgrounds)
    'dark:bg-green-400', 'dark:bg-green-500', 'dark:border-green-400', 'dark:border-green-500', 'dark:hover:bg-green-500', 'dark:hover:border-green-500',
    'dark:bg-red-400', 'dark:bg-red-500', 'dark:border-red-400', 'dark:border-red-500', 'dark:hover:bg-red-500', 'dark:hover:border-red-500',
    'dark:bg-yellow-400', 'dark:bg-yellow-500', 'dark:border-yellow-400', 'dark:border-yellow-500', 'dark:hover:bg-yellow-500', 'dark:hover:border-yellow-500',
    'dark:bg-orange-400', 'dark:bg-orange-500', 'dark:border-orange-400', 'dark:border-orange-500', 'dark:hover:bg-orange-500', 'dark:hover:border-orange-500',
    'dark:bg-amber-400', 'dark:bg-amber-500', 'dark:border-amber-400', 'dark:border-amber-500', 'dark:hover:bg-amber-500', 'dark:hover:border-amber-500',
    'dark:bg-slate-400', 'dark:bg-slate-500', 'dark:border-slate-400', 'dark:border-slate-500', 'dark:hover:bg-slate-500', 'dark:hover:border-slate-500',
    'dark:text-black', 'dark:text-gray-300', 'dark:hover:bg-gray-700'
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
