import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim": "#c6c4df",
        "surface-container-highest": "#e2e3e1",
        "on-primary-fixed": "#1a1a2e",
        "on-primary-fixed-variant": "#45455b",
        "on-primary-container": "#83829b",
        "on-tertiary-fixed": "#410004",
        "success": "#2D8F4E",
        "surface-container-lowest": "#ffffff",
        "primary-container": "#1a1a2e",
        "background": "#f9f9f7",
        "inverse-surface": "#2f3130",
        "on-error-container": "#93000a",
        "on-error": "#ffffff",
        "surface-container": "#eeeeec",
        "error": "#ba1a1a",
        "on-surface-variant": "#47464c",
        "tertiary-container": "#420004",
        "text-primary": "#2D2D2D",
        "secondary": "#6a5d45",
        "on-secondary-fixed": "#241a07",
        "surface-bright": "#f9f9f7",
        "outline": "#78767d",
        "primary": "#00000b",
        "border-subtle": "#E5E5E0",
        "surface-container-high": "#e8e8e6",
        "outline-variant": "#c8c5cd",
        "secondary-container": "#f0ddbf",
        "text-muted": "#8C8C8C",
        "tertiary-fixed": "#ffdad7",
        "on-tertiary-fixed-variant": "#930015",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#f1f1ef",
        "rating-gold": "#F5A623",
        "surface-alt": "#F0EDE8",
        "on-secondary-container": "#6f6149",
        "primary-fixed": "#e2e0fc",
        "on-surface": "#1a1c1b",
        "surface-dim": "#dadad8",
        "surface-tint": "#5d5c74",
        "on-secondary-fixed-variant": "#51452f",
        "tertiary": "#050000",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "warning": "#E8A317",
        "surface-variant": "#e2e3e1",
        "inverse-primary": "#c6c4df",
        "surface-container-low": "#f4f4f2",
        "on-tertiary-container": "#ed4848",
        "tertiary-fixed-dim": "#ffb3ae",
        "on-background": "#1a1c1b",
        "surface": "#f9f9f7",
        "secondary-fixed-dim": "#d6c4a7",
        "secondary-fixed": "#f3e0c2"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "margin-desktop": "80px",
        "base": "8px",
        "sm": "12px",
        "container-max": "1280px",
        "xl": "80px",
        "md": "24px",
        "margin-mobile": "24px",
        "lg": "48px",
        "gutter": "24px",
        "xs": "4px"
      },
      fontFamily: {
        "display-hero": ["Outfit", "sans-serif"],
        "headline-md": ["Outfit", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-caps": ["Outfit", "sans-serif"],
        "headline-xl": ["Outfit", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Outfit", "sans-serif"],
        "price-display": ["Space Mono", "monospace"],
        "headline-lg-mobile": ["Outfit", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "display-hero": ["56px", { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "26px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-xl": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "38px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "price-display": ["18px", { lineHeight: "24px", fontWeight: "500" }],
        "headline-lg-mobile": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "22px", fontWeight: "400" }]
      }
    }
  },
  plugins: [
    forms,
    containerQueries
  ],
}
