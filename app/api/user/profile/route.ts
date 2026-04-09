import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrInitCredits } from '@/lib/credits'

export const runtime = 'edge'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const DB = (process.env as unknown as Record<string, unknown>).DB as any

  const credits = DB
    ? await getOrInitCredits(DB, session.user.id)
    : { credits: 3, total_used: 0, plan: 'free' }

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    credits: credits.credits,       // -1 = 无限
    total_used: credits.total_used,
    plan: credits.plan,
  })
}
