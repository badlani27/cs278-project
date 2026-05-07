/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#becbb1",
        cream: "#f4f1ea",
        mist: "#e8efe4",
        blush: "#e8d4d4",
        sky: "#c9d9e8",
        ink: "#3d4038",
        muted: "#6b6f66",
        card: "#f7f5f0",
        line: "rgba(61, 64, 56, 0.12)",
      },
      fontFamily: {
        display: ['"Special Elite"', "ui-monospace", "monospace"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(61, 64, 56, 0.08)",
        lift: "0 4px 14px rgba(61, 64, 56, 0.06)",
      },
    },
  },
  plugins: [],
};
