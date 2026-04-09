-- 用户积分表（余额制，永不过期）
-- Run via: wrangler d1 execute image-bg-remover-db --file=migrations/0002_user_credits.sql

CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT NOT NULL PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 3,   -- 剩余积分，-1 表示无限（Pro订阅用户）
  total_used INTEGER NOT NULL DEFAULT 0, -- 累计使用次数（统计用）
  plan TEXT NOT NULL DEFAULT 'free',    -- 'free' | 'pro'（订阅制，后期用）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 使用记录表（可选，用于后台统计）
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
