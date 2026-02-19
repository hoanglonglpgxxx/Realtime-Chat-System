import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.SOCKET_URL,
  },
  async rewrites() {
    // Only rewrite direct backend API calls (/api/v1/*)
    // Do NOT rewrite /api/proxy/* (those are Next.js route handlers)
    const backendUrl = process.env.BE_URL || 'http://backend_chat:5000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;