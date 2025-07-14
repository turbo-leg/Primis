/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'api.placeholder.com',
      'res.cloudinary.com', // Cloudinary images
      'via.placeholder.com', // Placeholder images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
}

export default nextConfig
