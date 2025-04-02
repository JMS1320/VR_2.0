/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Deshabilitar ESLint durante el build para producción
      ignoreDuringBuilds: true,
    },
  }
  
  module.exports = nextConfig