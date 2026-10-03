const host = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "localhost";
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }] },
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
export default nextConfig;
