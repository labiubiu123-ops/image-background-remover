'use client'

import { useState } from 'react'

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string)
      setProcessedImage(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const removeBackground = async () => {
    if (!originalImage) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: originalImage }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove background')
      }

      const data = await response.json()
      setProcessedImage(data.image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    if (!processedImage) return
    const link = document.createElement('a')
    link.href = processedImage
    link.download = 'removed-bg.png'
    link.click()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Image Background Remover
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Remove backgrounds from images instantly with AI
        </p>

        {!originalImage ? (
          <div className="bg-white rounded-lg shadow-lg p-12">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-purple-500 transition">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</span>
              <span className="text-sm text-gray-400">JPG, PNG or WEBP (max 10MB)</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Original</h3>
                <img src={originalImage} alt="Original" className="w-full rounded" />
              </div>
              
              {processedImage && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Processed</h3>
                  <div className="relative" style={{backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px'}}>
                    <img src={processedImage} alt="Processed" className="w-full rounded" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              {!processedImage && (
                <button
                  onClick={removeBackground}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Remove Background'}
                </button>
              )}
              
              {processedImage && (
                <>
                  <button
                    onClick={downloadImage}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setOriginalImage(null)
                      setProcessedImage(null)
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition"
                  >
                    New Image
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
