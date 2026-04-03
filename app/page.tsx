'use client'

import { useState, useRef, useCallback } from 'react'
import CompareSlider from '@/components/CompareSlider'

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('image')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ERROR_MESSAGES: Record<string, string> = {
    FILE_TOO_LARGE: '文件超过 10MB，请压缩后重试',
    INVALID_FORMAT: '不支持的格式，请上传 JPG、PNG 或 WebP',
    API_QUOTA_EXCEEDED: 'API 免费额度已用尽，请稍后再试',
    INVALID_API_KEY: 'API Key 配置错误，请联系管理员',
    CONFIG_ERROR: '服务配置异常，请联系管理员',
    API_ERROR: 'AI 处理服务异常，请重试',
  }

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
      // 将 base64 转回 Blob，用 multipart 发送（不传 base64 字符串，减少带宽）
      const base64Data = originalImage.split(',')[1]
      const mimeType = originalImage.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
      const binary = atob(base64Data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mimeType })

      const fd = new FormData()
      fd.append('image', blob, `${originalFileName}.${mimeType.split('/')[1]}`)

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: fd,
      })

      if (!response.ok) {
        // 尝试解析 JSON 错误
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json()
          throw new Error(ERROR_MESSAGES[data.code] || `处理失败（${response.status}），请重试`)
        }
        throw new Error(`处理失败（${response.status}），请重试`)
      }

      // API 现在返回图片二进制，转为 base64
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
    
    // 将 data URL 转为 Blob，兼容微信浏览器
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
    
    // 释放 Blob URL
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
      <header className="text-center pt-14 pb-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-3">
          ✂️ BG Remover
        </h1>
        <p className="text-gray-400 text-lg">免费在线背景去除 · 秒级处理 · 图片不保存</p>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-20 flex flex-col items-center gap-8">

        {/* Upload Zone */}
        {!originalImage && (
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

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl bg-red-950/50 border border-red-800 text-red-300 px-5 py-4 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        {originalImage && (
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
        {originalImage && !processedImage && !loading && (
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
