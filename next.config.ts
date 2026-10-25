import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],
    experimental: {
        serverActions: {
            // Photo uploads are up to 3 MB (MAX_PHOTO_BYTES) plus form overhead. Vercel caps request bodies at 4.5 MB.
            bodySizeLimit: "4mb",
        },
    },
};

export default nextConfig;
