/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev }) => {
    // Keep dev builds stable on low-memory machines (skip huge pack cache).
    if (dev) {
      config.cache = false
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/.venv/**', '**/backend/**', '**/node_modules/**'],
      }
    }
    return config
  },
}

module.exports = nextConfig
