/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // 暴露给前端，直接从浏览器调用 remove.bg API
    NEXT_PUBLIC_REMOVEBG_API_KEY: process.env.REMOVEBG_API_KEY,
  },
}

module.exports = nextConfig
