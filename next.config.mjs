/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: '**.replicate.com' },
    ],
  },
}

export default nextConfig
