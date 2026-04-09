'use client'

interface NoCreditsModalProps {
  onClose: () => void
}

const PACKS = [
  { id: 'starter', label: 'Starter', credits: 10, price: '$0.99', unit: '$0.099/次', highlight: false },
  { id: 'basic',   label: 'Basic',   credits: 50, price: '$3.99', unit: '$0.079/次', highlight: true },
  { id: 'pro200',  label: 'Pro',     credits: 200, price: '$12.99', unit: '$0.065/次', highlight: false },
]

export default function NoCreditsModal({ onClose }: NoCreditsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#18181f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-4xl mb-3">💎</div>
          <h2 className="text-xl font-bold text-white mb-1">积分不足</h2>
          <p className="text-gray-400 text-sm">
            购买积分包，永不过期，按需使用
          </p>
        </div>

        {/* Packs */}
        <div className="px-6 pb-2 flex flex-col gap-3">
          {PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => {
                // TODO: 接入 PayPal 支付
                alert(`即将接入支付，敬请期待！\n套餐：${pack.label} ${pack.credits}积分 ${pack.price}`)
              }}
              className={`relative flex items-center justify-between rounded-xl px-4 py-3.5 border transition-all hover:scale-[1.01] active:scale-[0.99]
                ${pack.highlight
                  ? 'border-violet-500 bg-violet-600/20 ring-1 ring-violet-500/30'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
            >
              {pack.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  最受欢迎
                </span>
              )}
              <div className="flex items-center gap-3 text-left">
                <div>
                  <p className="text-white font-semibold">{pack.label}</p>
                  <p className="text-gray-400 text-xs">{pack.credits} 积分 · {pack.unit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{pack.price}</p>
                <p className="text-gray-500 text-xs">永不过期</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <p className="text-xs text-gray-600 mb-3">
            🔒 支付安全 · 积分永不过期 · 支持退款（7天内）
          </p>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            暂不购买
          </button>
        </div>
      </div>
    </div>
  )
}
