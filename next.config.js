/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Fix #2: ESLint bug bypass
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ptmnwbvrybzrwruvrrkk.supabase.co', // Fix #3: https:// hata diya
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;