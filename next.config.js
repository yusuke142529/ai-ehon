// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'my-s3-bucket.s3.amazonaws.com',
      },
    ],
  },
  // SWC設定を明示的に有効化
  swcMinify: true,
  compiler: {
    // エモーション用の設定
    emotion: true,
  },
};

module.exports = withNextIntl(nextConfig);