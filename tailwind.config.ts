import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#111827',
        'brand-accent': '#2563eb',
      },
    },
  },
  plugins: [],
};

export default config;

