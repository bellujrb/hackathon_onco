/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removido 'output: export' para usar com next start e PM2
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
