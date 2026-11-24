/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B2641',       // Deep Ocean Navy from reference
          card: '#0F3154',     // Elevated card surface
          cardHover: '#133A63',
          border: '#1C476E',   // Card borders
          muted: '#24527A'
        },
        brand: {
          mint: '#5CDB94',      // Vibrant seafoam mint from reference navbar & CTA
          mintHover: '#4CD087',
          navy: '#0B2641',      // Deep oceanic midnight navy
          darkNavy: '#071B2E',
          textNavy: '#0B2540',  // High-contrast dark navy text on mint
          sky: '#38BDF8',       // Bright cyan/sky visor blue from mascot
          purple: '#5CDB94',    // Remap purple to mint for cohesive theme
          cyan: '#38BDF8',
          emerald: '#5CDB94',
          rose: '#F43F5E',
          amber: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
