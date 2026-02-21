module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'font-sans' (the default) use Jakarta
        // sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
      },
    },
  },
};
