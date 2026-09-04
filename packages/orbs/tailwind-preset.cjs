/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        git: {
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          inset: "var(--bg-inset)",
          border: "var(--border-default)",
          "border-muted": "var(--border-muted)",
          fg: "var(--fg-default)",
          "fg-muted": "var(--fg-muted)",
          "fg-subtle": "var(--fg-subtle)",
          "fg-on-emphasis": "var(--fg-on-emphasis)",
        },
        background: "var(--bg-base)",
        surface: "var(--bg-elevated)",
        elevated: "var(--bg-elevated)",
        inset: "var(--bg-inset)",
        foreground: "var(--fg-default)",
        secondary: "var(--fg-muted)",
        faint: "var(--fg-subtle)",
        border: "var(--border-muted)",
        "border-strong": "var(--border-default)",
        ring: "var(--fg-default)",
      },
      borderColor: {
        DEFAULT: "var(--border-muted)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
};
