/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.dribbble.com' },
      { protocol: 'https', hostname: 'ph-files.imgix.net' },
      { protocol: 'https', hostname: 'ph-avatars.imgix.net' },
      { protocol: 'https', hostname: '**.imgix.net' },
    ],
  },
}
module.exports = nextConfig
