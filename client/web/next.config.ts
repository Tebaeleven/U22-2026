import type { NextConfig } from "next";

function buildStoragePatterns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return [];

  const url = new URL(supabaseUrl);
  return [
    {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildStoragePatterns(),
  },
};

export default nextConfig;
