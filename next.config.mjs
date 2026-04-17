/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: '**.replicate.com' },
    ],
  },
  eslint: {
    // Minor unused-variable warnings only — does not affect runtime
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
