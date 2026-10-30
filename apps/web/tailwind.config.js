import { abrainoPreset } from '../../packages/ui/src/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [abrainoPreset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
