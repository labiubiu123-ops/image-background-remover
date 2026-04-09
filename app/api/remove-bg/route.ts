import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrInitCredits, hasCredits, consumeCredit } from '@/lib/credits'

export const runtime = 'edge'

function getDB() {
  return (process.env as unknown as Record<string, unknown>).DB as any
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
    const DB = getDB()

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

    // ── 4. 调用 Remove.bg API（原有逻辑不变）──
    const apiKey = process.env.REMOVEBG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 密钥未配置' }, { status: 500 })
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: image_base64,
        size: 'full',
        type: 'auto',
      }),
    })

    if (!response.ok) {
      if (response.status === 402) return NextResponse.json({ error: 'API 额度已用完' }, { status: 402 })
      if (response.status === 403) return NextResponse.json({ error: 'API 密钥无效' }, { status: 403 })
      return NextResponse.json({ error: `处理失败（${response.status}）` }, { status: 500 })
    }

    const imageBuffer = await response.arrayBuffer()
    const result_b64 = Buffer.from(imageBuffer).toString('base64')

    // ── 5. 扣减积分 ──
    let creditsRemaining: number | undefined
    if (DB) {
      creditsRemaining = await consumeCredit(DB, userId, 'success')
    }

    return NextResponse.json({ result_b64, credits_remaining: creditsRemaining })

  } catch (err) {
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 })
  }
}
