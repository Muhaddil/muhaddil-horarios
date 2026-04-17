/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/nombre-de-tu-repo',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
export default nextConfig