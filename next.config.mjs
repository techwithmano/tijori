/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages: ["mongoose", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
