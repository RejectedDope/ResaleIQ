import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f9f6ef',
        tan: '#d9cbb7',
        sage: '#5f7a63',
        clay: '#d78344',
        ink: '#1c1c1c',
      },
    },
  },
  plugins: [],
};

export default config;
