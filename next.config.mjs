/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/muhaddil-horarios',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
export default nextConfig