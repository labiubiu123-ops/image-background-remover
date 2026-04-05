import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { D1Adapter } from '@auth/d1-adapter'

// Cloudflare Pages 通过 process.env 暴露 D1 binding
// 本地开发时 DB 为 undefined，会跳过 adapter（不存储）
declare global {
  // eslint-disable-next-line no-var
  var __D1_DB__: D1Database | undefined
}

function getDB(): D1Database | undefined {
  // Cloudflare Pages runtime 通过 ctx.env 注入，但 NextAuth 在 edge 需从 globalThis 取
  // 实际 binding 由 wrangler.toml [[d1_databases]] 声明，运行时自动挂载
  return (globalThis as Record<string, unknown>).DB as D1Database | undefined
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDB()

  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    adapter: db ? D1Adapter(db) : undefined,
    session: {
      // 没有 DB 时用 JWT，有 DB 时用 database session
      strategy: db ? 'database' : 'jwt',
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async session({ session, user, token }) {
        // database session: user 有值；jwt session: token 有值
        if (session.user) {
          session.user.id = (user?.id ?? token?.sub) as string
        }
        return session
      },
    },
  }
})
