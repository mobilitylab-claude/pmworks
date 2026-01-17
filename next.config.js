/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config, { dev }) => {
        if (dev) {
            // Samba 파일 잠금 오류 방지를 위한 최소화된 설정
            config.cache = false;
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
                ignored: /node_modules/,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
