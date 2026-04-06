import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { D1Adapter } from '@auth/d1-adapter'

// Cloudflare D1 type stub (avoids @cloudflare/workers-types dependency)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D1Database = any

// Cloudflare Pages 通过 process.env 暴露 D1 binding
// 本地开发时 DB 为 undefined，会跳过 adapter（不存储）
declare global {
  // eslint-disable-next-line no-var
  var __D1_DB__: D1Database | undefined
}

function getDB(): D1Database | undefined {
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
      strategy: db ? 'database' : 'jwt',
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async session({ session, user, token }: { session: any; user: any; token: any }) {
        if (session.user) {
          session.user.id = (user?.id ?? token?.sub) as string
        }
        return session
      },
    },
  }
})
