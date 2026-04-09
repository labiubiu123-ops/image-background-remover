// lib/credits.ts
// 积分系统核心逻辑：查询、扣减、初始化

type D1Database = any // Cloudflare D1 type stub

export interface UserCredits {
  user_id: string
  credits: number      // 剩余积分，-1 = 无限（Pro）
  total_used: number
  plan: 'free' | 'pro'
}

/**
 * 获取用户积分信息，如果不存在则初始化（新用户赠送3积分）
 */
export async function getOrInitCredits(db: D1Database, userId: string): Promise<UserCredits> {
  const existing = await db
    .prepare('SELECT * FROM user_credits WHERE user_id = ?')
    .bind(userId)
    .first<UserCredits>()

  if (existing) return existing

  // 新用户：初始化赠送 3 积分
  await db
    .prepare(`
      INSERT INTO user_credits (user_id, credits, total_used, plan)
      VALUES (?, 3, 0, 'free')
    `)
    .bind(userId)
    .run()

  return { user_id: userId, credits: 3, total_used: 0, plan: 'free' }
}

/**
 * 检查用户是否有足够积分
 * credits = -1 表示无限（Pro订阅用户）
 */
export function hasCredits(credits: UserCredits): boolean {
  return credits.credits === -1 || credits.credits > 0
}

/**
 * 扣减1积分并记录使用日志
 * 返回扣减后剩余积分（-1 表示无限不变）
 */
export async function consumeCredit(
  db: D1Database,
  userId: string,
  status: 'success' | 'failed' = 'success'
): Promise<number> {
  const now = Math.floor(Date.now() / 1000)
  const logId = crypto.randomUUID()

  // 记录使用日志
  await db
    .prepare(`
      INSERT INTO usage_logs (id, user_id, credits_used, status, created_at)
      VALUES (?, ?, 1, ?, ?)
    `)
    .bind(logId, userId, status, now)
    .run()

  if (status === 'failed') {
    // 处理失败不扣积分
    return -99 // sentinel，调用方不使用此值
  }

  // 扣减积分（无限用户 credits=-1 不扣）
  const result = await db
    .prepare(`
      UPDATE user_credits
      SET
        credits = CASE WHEN credits = -1 THEN -1 ELSE credits - 1 END,
        total_used = total_used + 1,
        updated_at = ?
      WHERE user_id = ?
      RETURNING credits
    `)
    .bind(now, userId)
    .first<{ credits: number }>()

  return result?.credits ?? 0
}

/**
 * 给用户增加积分（购买积分包时调用）
 */
export async function addCredits(db: D1Database, userId: string, amount: number): Promise<number> {
  const now = Math.floor(Date.now() / 1000)

  const result = await db
    .prepare(`
      UPDATE user_credits
      SET credits = credits + ?, updated_at = ?
      WHERE user_id = ?
      RETURNING credits
    `)
    .bind(amount, now, userId)
    .first<{ credits: number }>()

  return result?.credits ?? 0
}
