/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Keep production builds resilient; lint is run separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
