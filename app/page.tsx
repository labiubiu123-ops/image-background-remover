'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import CompareSlider from '@/components/CompareSlider'
import LoginButton from '@/components/LoginButton'
import UserMenu from '@/components/UserMenu'

export default function Home() {
  const { data: session, status } = useSession()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('image')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLoggedIn = status === 'authenticated'
  const isLoading = status === 'loading'

  const handleFile = useCallback((file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('不支持的格式，请上传 JPG、PNG 或 WebP')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('文件超过 10MB，请压缩后重试')
      return
    }

    setOriginalFileName(file.name.replace(/\.[^.]+$/, ''))
    setProcessedImage(null)
    setError(null)
    setElapsedTime(null)

    const reader = new FileReader()
    reader.onload = (e) => setOriginalImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const removeBackground = async () => {
    if (!originalImage) return

    setLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      const base64Data = originalImage.split(',')[1]
      const apiKey = process.env.NEXT_PUBLIC_REMOVEBG_API_KEY

      if (!apiKey) {
        throw new Error('API 密钥未配置，请联系管理员')
      }

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_file_b64: base64Data,
          size: 'full',
          type: 'auto',
        }),
      })

      if (!response.ok) {
        if (response.status === 402) throw new Error('API 额度已用完，请联系管理员')
        if (response.status === 403) throw new Error('API 密钥无效，请联系管理员')
        throw new Error(`处理失败（${response.status}），请重试`)
      }

      const imageBlob = await response.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageBlob)
      })

      setProcessedImage(dataUrl)
      setElapsedTime(Date.now() - startTime)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    if (!processedImage) return

    const arr = processedImage.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${originalFileName}_no_bg.png`
    a.click()

    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const reset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError(null)
    setElapsedTime(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          ✂️ BG Remover
        </h1>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
          )}
          {!isLoading && !isLoggedIn && <LoginButton />}
          {!isLoading && isLoggedIn && session?.user && (
            <UserMenu user={session.user} />
          )}
        </div>
      </header>

      {/* Hero (only when not logged in) */}
      {!isLoggedIn && !isLoading && (
        <section className="text-center pt-16 pb-12 px-4">
          <p className="text-gray-400 text-lg mb-2">免费在线背景去除 · 秒级处理 · 图片不保存</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
            登录即可免费使用
          </h2>
          <p className="text-gray-500 mb-8 text-sm">使用 Google 账号一键登录，无需注册</p>
          <LoginButton />
        </section>
      )}

      {/* Subtitle (when logged in) */}
      {isLoggedIn && !originalImage && (
        <p className="text-center text-gray-400 text-base pb-4">
          免费在线背景去除 · 秒级处理 · 图片不保存
        </p>
      )}

      <div className="max-w-4xl mx-auto px-4 pb-20 flex flex-col items-center gap-8">

        {/* Upload Zone - only when logged in */}
        {isLoggedIn && !originalImage && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`w-full border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
              ${dragOver
                ? 'border-violet-400 bg-violet-950/30'
                : 'border-gray-700 bg-gray-900 hover:border-violet-500 hover:bg-gray-900/80'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
            />
            <div className="text-5xl mb-4">📤</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              拖拽图片到此处，或点击上传
            </h2>
            <p className="text-gray-500 text-sm">支持 JPG、PNG、WebP · 最大 10MB</p>
          </div>
        )}

        {/* Locked state - not logged in */}
        {!isLoggedIn && !isLoading && (
          <div className="w-full border-2 border-dashed border-gray-800 rounded-2xl p-16 text-center bg-gray-900/40">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              请先登录后使用
            </h2>
            <p className="text-gray-600 text-sm mb-6">支持 JPG、PNG、WebP · 最大 10MB</p>
            <LoginButton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl bg-red-950/50 border border-red-800 text-red-300 px-5 py-4 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        {isLoggedIn && originalImage && (
          <div className="flex flex-wrap gap-3 justify-center">
            {!processedImage && (
              <button
                onClick={removeBackground}
                disabled={loading}
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:opacity-90 disabled:opacity-40
                  text-white font-semibold py-3 px-8 rounded-full transition-all disabled:cursor-not-allowed"
              >
                {loading ? '处理中…' : '✨ 去除背景'}
              </button>
            )}
            {processedImage && (
              <button
                onClick={downloadImage}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-full transition-all"
              >
                ⬇️ 下载 PNG
              </button>
            )}
            <button
              onClick={reset}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 px-8 rounded-full border border-gray-600 transition-all"
            >
              🔄 重新上传
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-violet-400 rounded-full animate-spin" />
            <p className="text-gray-400">正在处理，请稍候…</p>
          </div>
        )}

        {/* Compare Slider */}
        {originalImage && processedImage && (
          <div className="w-full flex flex-col items-center gap-3">
            <CompareSlider before={originalImage} after={processedImage} />
            {elapsedTime && (
              <p className="text-gray-500 text-sm">
                ⏱ 处理耗时 {(elapsedTime / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}

        {/* Original preview (before processing) */}
        {isLoggedIn && originalImage && !processedImage && !loading && (
          <div className="w-full max-w-2xl">
            <p className="text-gray-500 text-sm mb-2 text-center">原图预览</p>
            <img
              src={originalImage}
              alt="原图"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        )}

      </div>

      <footer className="text-center pb-8 text-gray-600 text-sm">
        图片仅用于处理，不存储在服务器 · Powered by Remove.bg
      </footer>
    </main>
  )
}
