module.exports = {
  content: [
    "./templates/**/*.html",
    "./reception/templates/**/*.html",
    "./static/js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Instrument Serif", "serif"],
        body: ["Barlow", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "9999px",
      },
    },
  },
  plugins: [],
};
