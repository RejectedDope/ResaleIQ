import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F5F0',
        tan: '#C9B99A',
        green: '#3D6B4F',
        accent: '#D45C2D',
        charcoal: '#1A1714'
      }
    }
  },
  plugins: []
}

export default config
