// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config:any) => {
    // This is needed for WebAssembly
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
