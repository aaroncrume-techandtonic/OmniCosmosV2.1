import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This allows the app to run on GitHub Pages subdirectories
  base: './', 
  define: {
    // This injects the API key from the build environment into the code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY)
  }
});