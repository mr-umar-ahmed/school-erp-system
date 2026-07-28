import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spreadsheet imports post the file through a server action; 6MB covers
  // the 5MB file cap plus multipart overhead.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  // exceljs is CommonJS with dynamic requires — keep it out of the bundle.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
