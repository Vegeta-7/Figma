/** @type {import('next').NextConfig} */
const nextConfig = {  
    webpack: (config) => {
        config.externals.push({
            "utf-8-validate": "commonjs utf-8-validate",
            "bufferutil": "commonjs bufferutil",
            canvas: "commonjs canvas"
        })
    return config;
    },
    images: {         // When you use the Next.js <Image> component to load an image from https://liveblocks.io, Next.js will use its image optimization API to serve an optimized version of the image:
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'liveblocks.io',
                port: ''
            }
        ]
    },
    typescript: {
        ignoreBuildErrors: true
    }
};

export default nextConfig;
