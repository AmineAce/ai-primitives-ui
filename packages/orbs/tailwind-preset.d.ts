// Type declarations for ./tailwind-preset.cjs (Tailwind CSS v3-style preset).
// Kept dependency-free on purpose: the orb package ships zero runtime deps.
declare const preset: {
  theme: {
    extend: {
      colors: Record<string, string | Record<string, string>>;
      borderColor: { DEFAULT: string };
      borderRadius: Record<string, string>;
      fontFamily: { sans: string[]; mono: string[] };
    };
  };
};
export = preset;
