import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrInitCredits, hasCredits, consumeCredit } from '@/lib/credits'

export const runtime = 'edge'

// Cloudflare Workers AI binding type stub
type CloudflareAI = {
  run: (model: string, input: Record<string, unknown>) => Promise<Response | { image: string }>
}

function getBindings() {
  const env = process.env as unknown as Record<string, unknown>
  return {
    DB: env.DB as any,
    AI: env.AI as CloudflareAI | undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. 验证登录状态 ──
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录后使用', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { DB, AI } = getBindings()

    // ── 2. 检查积分 ──
    if (DB) {
      const credits = await getOrInitCredits(DB, userId)
      if (!hasCredits(credits)) {
        return NextResponse.json(
          {
            error: '积分不足，请购买积分包继续使用',
            code: 'NO_CREDITS',
            credits_remaining: 0,
          },
          { status: 402 }
        )
      }
    }

    // ── 3. 解析图片 ──
    const { image_base64 } = await request.json()
    if (!image_base64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    // ── 4. 调用 AI 去背景 ──
    let result_b64: string

    if (AI) {
      // 优先使用 Cloudflare Workers AI（成本极低，约 $0.001/次）
      result_b64 = await removeWithCfAI(AI, image_base64)
    } else {
      // 回退到 Remove.bg API
      result_b64 = await removeWithRemoveBg(image_base64)
    }

    // ── 5. 扣减积分 ──
    let creditsRemaining: number | undefined
    if (DB) {
      creditsRemaining = await consumeCredit(DB, userId, 'success')
    }

    return NextResponse.json({
      result_b64,
      credits_remaining: creditsRemaining,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : '服务器错误，请重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Cloudflare Workers AI 去背景 ──
async function removeWithCfAI(ai: CloudflareAI, image_base64: string): Promise<string> {
  // 将 base64 转为 Uint8Array
  const binaryStr = atob(image_base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const response = await ai.run('@cf/tensorart/rmbg-1.4', {
    image: Array.from(bytes),
  })

  if (response instanceof Response) {
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  }

  // 某些版本直接返回 { image: base64 }
  if ('image' in response) {
    return response.image as string
  }

  throw new Error('Cloudflare AI 返回格式异常')
}

// ── Remove.bg API 回退方案 ──
async function removeWithRemoveBg(image_base64: string): Promise<string> {
  const apiKey = process.env.REMOVEBG_API_KEY
  if (!apiKey) throw new Error('API 密钥未配置')

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_file_b64: image_base64,
      size: 'preview', // 免费用户用 preview（降成本），Pro 用户可改 full
      type: 'auto',
    }),
  })

  if (!response.ok) {
    if (response.status === 402) throw new Error('API 额度已用完')
    if (response.status === 403) throw new Error('API 密钥无效')
    throw new Error(`处理失败（${response.status}）`)
  }

  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}
