import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default — well
      // under a single 5MB property photo (MAX_IMAGE_BYTES), which is what
      // was causing every upload of a normal-sized photo to fail with a 413
      // ("Body exceeded 1 MB limit"). Sized for the app's own worst case:
      // MAX_IMAGE_BYTES (5MB) × MAX_IMAGES_PER_PROPERTY (10), selected and
      // uploaded together in one batch, plus multipart overhead.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
