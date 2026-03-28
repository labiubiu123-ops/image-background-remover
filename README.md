# Image Background Remover

免费在线背景去除工具，AI 驱动，秒级处理。

## 功能

- 📤 拖拽 / 点击上传（JPG、PNG、WebP，最大 10MB）
- ✨ AI 自动去除背景（由 Remove.bg 提供）
- 🎚️ 原图 vs 结果对比滑块
- ⬇️ 一键下载透明 PNG
- 🔒 图片不存储，处理完即释放
- 📱 移动端适配

## 技术栈

- **前端**：Next.js 14 + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes
- **AI**：Remove.bg API
- **部署**：Cloudflare Pages

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Remove.bg API Key

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署到 Cloudflare Pages

1. 将代码 push 到 GitHub
2. 在 Cloudflare Pages 连接 GitHub 仓库
3. Build 配置：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`
4. 环境变量：添加 `REMOVEBG_API_KEY`

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `REMOVEBG_API_KEY` | Remove.bg API Key（[获取地址](https://www.remove.bg/api)） |
