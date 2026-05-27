/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Dynamic destination based on environment, falling back to local port 3001 for dev
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/url/:path*',
        destination: `${backendUrl}/api/url/:path*`,
      },
    ];
  },
};

export default nextConfig;
