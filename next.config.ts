import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raise the default 1MB limit so a receipt photo can be submitted
      // along with the rest of the expense form.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
