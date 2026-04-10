'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'

const PACKS = [
  {
    id: 'starter',
    label: 'Starter',
    credits: 10,
    price: '$0.99',
    priceNum: 0.99,
    unit: '$0.099/次',
    billingNote: '一次性购买',
    highlight: false,
    features: ['10 次去背景', '积分永不过期', '全尺寸输出（透明 PNG）', '个人用途'],
  },
  {
    id: 'basic',
    label: 'Basic',
    credits: 50,
    price: '$3.99',
    priceNum: 3.99,
    unit: '$0.079/次',
    billingNote: '一次性购买',
    highlight: false,
    features: ['50 次去背景', '积分永不过期', '全尺寸输出（透明 PNG）', '个人及商业用途'],
  },
  {
    id: 'pro',
    label: 'Pro',
    credits: -1,
    price: '$19.9',
    priceNum: 19.9,
    unit: '无限次使用',
    billingNote: '按月订阅，随时取消',
    highlight: true,
    features: ['无限次去背景', '全尺寸输出（透明 PNG）', '个人及商业用途', '支持团队共享使用'],
  },
]

const FAQS = [
  {
    q: '积分会过期吗？',
    a: '不会。Starter 和 Basic 套餐购买的积分永久有效，不设任何有效期限制，随时可以使用。',
  },
  {
    q: 'Pro 方案是如何计费的？',
    a: 'Pro 方案按月订阅，$19.9/月，订阅期间可无限次使用去背景功能，随时可以取消，取消后当前订阅周期仍然有效。',
  },
  {
    q: '注册后有免费额度吗？',
    a: '有！新用户注册后自动获得 3 次免费体验积分，无需任何付费即可感受效果。',
  },
  {
    q: '图片会被存储到服务器吗？',
    a: '不会。您的图片仅在处理时传输，处理完成后立即丢弃，我们不保存任何图片文件。',
  },
  {
    q: '支持哪些图片格式？',
    a: '支持 JPG、PNG、WebP 格式，单张最大 10MB。输出均为透明背景 PNG 文件。',
  },
  {
    q: '可以用于商业用途吗？',
    a: 'Basic 套餐及 Pro 方案均支持个人及商业用途。Starter 套餐及免费额度仅限个人非商业使用。',
  },
  {
    q: '支持哪些支付方式？',
    a: '即将支持信用卡及 PayPal，后续将陆续接入更多支付方式。敬请期待！',
  },
  {
    q: '如何查看剩余积分？',
    a: '登录后，页面顶部导航栏会实时显示您的剩余积分数量。',
  },
]

export default function PricingSection() {
  const { data: session } = useSession()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleBuy = (pack: typeof PACKS[0]) => {
    if (!session) {
      signIn('google', { callbackUrl: '/' })
      return
    }
    // TODO: 接入支付
    if (pack.id === 'pro') {
      alert(`订阅功能即将上线！\n方案：Pro 包月 · 无限次使用 · ${pack.price}/月`)
    } else {
      alert(`支付功能即将上线！\n套餐：${pack.label} · ${pack.credits}积分 · ${pack.price}`)
    }
  }

  return (
    <section id="pricing" className="w-full max-w-5xl mx-auto px-4 py-20">

      {/* Section header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          简单透明的定价
        </h2>
        <p className="text-gray-400 text-lg">
          按需购买或包月订阅，按你的节奏使用
        </p>
      </div>

      {/* Free badge */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-2 rounded-full">
          <span>🎁</span>
          <span>新用户注册即送 <strong>3次免费</strong> 体验额度</span>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {PACKS.map(pack => (
          <div
            key={pack.id}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all
              ${pack.highlight
                ? 'border-violet-500 bg-violet-950/30 shadow-lg shadow-violet-500/10'
                : 'border-white/10 bg-white/3 hover:border-white/20'
              }`}
          >
            {pack.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  最受欢迎
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">{pack.label}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{pack.price}</span>
                {pack.id === 'pro' && <span className="text-gray-400 text-sm">/月</span>}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{pack.unit}</p>
              <p className="text-gray-600 text-xs mt-0.5">{pack.billingNote}</p>
            </div>

            <ul className="flex-1 space-y-2.5 mb-6">
              {pack.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleBuy(pack)}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]
                ${pack.highlight
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
            >
              {session
                ? pack.id === 'pro' ? '订阅 Pro 方案' : `购买 ${pack.label} 包`
                : '登录后购买'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-white text-center mb-8">常见问题</h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border border-white/8 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
              >
                <span className="text-gray-100 font-medium text-sm">{faq.q}</span>
                <span className={`text-gray-500 text-lg transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5">
                  <div className="pt-3">{faq.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <p className="text-gray-500 text-sm mb-4">还有疑问？</p>
        <a
          href="mailto:support@image-background--remove.shop"
          className="text-violet-400 hover:text-violet-300 text-sm underline underline-offset-4 transition-colors"
        >
          联系我们
        </a>
      </div>
    </section>
  )
}
