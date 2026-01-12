/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "",
  assetPrefix: "/litellm-asset-prefix", // If a server_root_path is set, this will be overridden by runtime injection
  images: {
    unoptimized: true,
  },
};

nextConfig.experimental = {
  missingSuspenseWithCSRBailout: false,
};

export default nextConfig;
