/** @type {import('next').NextConfig} */
const nextConfig = {
  // X-Powered-By: Next.js を削除
  poweredByHeader: false,

  // 必要であれば reactStrictMode など他の設定も追加
  reactStrictMode: true
};

export default nextConfig;