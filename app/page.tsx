'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import CompareSlider from '@/components/CompareSlider'
import CreditsBar from '@/components/CreditsBar'
import NoCreditsModal from '@/components/NoCreditsModal'
import PricingSection from '@/components/PricingSection'

export default function Home() {
  const { data: session, status } = useSession()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('image')
  const [showNoCredits, setShowNoCredits] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | undefined>(undefined)
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
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Data }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        // 积分不足，弹出购买弹窗
        if (response.status === 402 || err.code === 'NO_CREDITS') {
          setShowNoCredits(true)
          return
        }
        throw new Error(err.error || `处理失败（${response.status}），请重试`)
      }
      const { result_b64, credits_remaining } = await response.json()
      setProcessedImage(`data:image/png;base64,${result_b64}`)
      setElapsedTime(Date.now() - startTime)
      if (credits_remaining !== undefined) setCreditsRemaining(credits_remaining)
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
    while (n--) u8arr[n] = bstr.charCodeAt(n)
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
    <div className="min-h-screen bg-[#0f0f13] text-gray-100 flex flex-col">

      {/* 积分不足弹窗 */}
      {showNoCredits && <NoCreditsModal onClose={() => setShowNoCredits(false)} />}

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✂️</span>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            BG Remover
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
          )}
          {!isLoading && !isLoggedIn && (
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium py-2 px-4 rounded-full transition-all"
            >
              <GoogleIcon />
              登录
            </button>
          )}
          {!isLoading && isLoggedIn && session?.user && (
            <div className="flex items-center gap-3">
              {/* 积分显示 */}
              <CreditsBar onUpgradeClick={() => setShowNoCredits(true)} />
              {session.user.image
                ? <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-violet-500/40" />
                : <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">{session.user.name?.[0]}</div>
              }
              <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                退出
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 max-w-4xl mx-auto w-full gap-10">

        {/* Not logged in state */}
        {!isLoggedIn && !isLoading && (
          <div className="w-full flex flex-col items-center gap-6 pt-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  一键去除图片背景
                </span>
              </h1>
              <p className="text-gray-400 text-lg">上传图片，AI 自动抠图，秒级完成</p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {['⚡ 秒级处理', '🔒 图片不存储', '🎯 高精度抠图', '📥 下载透明 PNG'].map(f => (
                <span key={f} className="bg-white/5 border border-white/10 text-gray-300 text-sm px-4 py-1.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>

            {/* Login CTA */}
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3.5 px-8 rounded-full shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GoogleIcon color />
              使用 Google 账号免费登录
            </button>

            {/* Preview mockup */}
            <div className="w-full max-w-2xl rounded-2xl border border-white/8 bg-white/3 p-6 flex items-center justify-center gap-4 mt-2">
              <div className="flex-1 h-32 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-500 text-sm">原图</div>
              <div className="text-violet-400 text-2xl font-bold">→</div>
              <div className="flex-1 h-32 rounded-xl flex items-center justify-center text-gray-500 text-sm"
                style={{ background: 'repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 0 0 / 16px 16px', borderRadius: '0.75rem' }}>
                透明背景
              </div>
            </div>
          </div>
        )}

        {/* Logged in — upload zone */}
        {isLoggedIn && !originalImage && (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-100 mb-1">上传图片，开始抠图</h1>
              <p className="text-gray-500 text-sm">支持 JPG、PNG、WebP，最大 10MB</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-200
                ${dragOver
                  ? 'border-violet-500 bg-violet-900/20 scale-[1.01]'
                  : 'border-white/10 bg-white/3 hover:border-violet-500/60 hover:bg-violet-900/10'
                }`}
            >
              <input ref={fileInputRef} type="file" className="hidden"
                accept="image/jpeg,image/png,image/webp" onChange={handleFileInput} />
              <div className="text-6xl mb-5">📤</div>
              <p className="text-gray-200 font-semibold text-lg mb-1">拖拽图片到此处</p>
              <p className="text-gray-500 text-sm mb-5">或</p>
              <span className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors">
                点击选择文件
              </span>
            </div>

            {/* Tips */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600">
              <span>✓ 人像 &amp; 产品图效果最佳</span>
              <span>✓ 图片不上传到服务器</span>
              <span>✓ 结果可直接下载 PNG</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl bg-red-950/40 border border-red-800/60 text-red-300 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            {error}
          </div>
        )}

        {/* Action buttons */}
        {isLoggedIn && originalImage && (
          <div className="flex flex-wrap gap-3 justify-center">
            {!processedImage && !loading && (
              <button
                onClick={removeBackground}
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-3.5 px-10 rounded-full shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                ✨ 去除背景
              </button>
            )}
            {processedImage && (
              <button
                onClick={downloadImage}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-10 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                ⬇️ 下载 PNG
              </button>
            )}
            <button
              onClick={reset}
              className="bg-white/8 hover:bg-white/12 border border-white/10 text-gray-300 font-medium py-3.5 px-8 rounded-full transition-all"
            >
              🔄 重新上传
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">AI 正在处理，请稍候…</p>
          </div>
        )}

        {/* Compare Slider */}
        {originalImage && processedImage && (
          <div className="w-full flex flex-col items-center gap-3">
            <CompareSlider before={originalImage} after={processedImage} />
            {elapsedTime && (
              <p className="text-gray-600 text-xs">⏱ 处理耗时 {(elapsedTime / 1000).toFixed(1)}s</p>
            )}
          </div>
        )}

        {/* Original preview before processing */}
        {isLoggedIn && originalImage && !processedImage && !loading && (
          <div className="w-full max-w-2xl">
            <p className="text-gray-600 text-xs mb-3 text-center uppercase tracking-wider">原图预览</p>
            <img src={originalImage} alt="原图" className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
          </div>
        )}

      </main>

      {/* ── Pricing & FAQ ── */}
      <div className="border-t border-white/5">
        <PricingSection />
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6 text-center text-gray-700 text-xs space-y-1">
        <p>图片仅用于处理，不存储在服务器</p>
        <p>© 2025 BG Remover · <a href="mailto:support@image-background--remove.shop" className="hover:text-gray-500 transition-colors">联系我们</a></p>
      </footer>
    </div>
  )
}

function GoogleIcon({ color = false }: { color?: boolean }) {
  if (color) return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" opacity=".9"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity=".9"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" opacity=".9"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity=".9"/>
    </svg>
  )
}
