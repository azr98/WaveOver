/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['img.clerk.com'],
  },
}

module.exports = nextConfig 