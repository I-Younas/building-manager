import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/resident-login", destination: "/login?role=resident", permanent: true },
      { source: "/staff-login", destination: "/login?role=staff", permanent: true },
    ];
  },
};

export default nextConfig;
