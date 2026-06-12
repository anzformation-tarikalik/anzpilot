module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans','system-ui'], display: ['Sora','Georgia'] },
      colors: {
        brand: { 500:'#2d5af7', 600:'#1a3ee8', 700:'#162fd4' }
      }
    }
  },
  plugins: []
}
