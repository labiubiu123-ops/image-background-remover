'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface CompareSliderProps {
  before: string  // 原图（右侧）
  after: string   // 处理后（左侧，透明背景）
}

export default function CompareSlider({ before, after }: CompareSliderProps) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onMouseDown = () => setDragging(true)
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) updatePosition(e.clientX)
  }, [dragging, updatePosition])
  const onMouseUp = () => setDragging(false)

  const onTouchStart = () => setDragging(true)
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (dragging) updatePosition(e.touches[0].clientX)
  }, [dragging, updatePosition])
  const onTouchEnd = () => setDragging(false)

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onMouseMove, onTouchMove])

  return (
    <div className="w-full max-w-2xl">
      <p className="text-gray-500 text-sm mb-2 text-center">← 拖动滑块对比效果 →</p>
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-xl"
        style={{
          background: 'repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 0 0 / 20px 20px',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* After (processed) - full width bottom layer */}
        <img
          src={after}
          alt="处理后"
          className="block w-full h-auto"
          draggable={false}
        />

        {/* Before (original) - clipped to right of slider */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <img
            src={before}
            alt="原图"
            className="block w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center pointer-events-none -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${position}%` }}
        >
          <span className="text-gray-600 text-sm font-bold select-none">⇔</span>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-4">
          <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">处理后</span>
        </div>
        <div className="absolute bottom-3 right-4">
          <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">原图</span>
        </div>
      </div>
    </div>
  )
}
