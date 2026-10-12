/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    // Se BACKEND_URL não estiver configurado (produção na Vercel), usa os handlers nativos do Next.js
    if (!backendUrl) {
      return [];
    }

    return [
      {
        source: '/api/triage/:path*',
        destination: `${backendUrl}/api/triage/:path*`,
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;
