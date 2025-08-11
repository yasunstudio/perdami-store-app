import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditLog } from '@/lib/audit'

import { comparePasswords } from '@/lib/password'
import { randomUUID } from 'crypto'

declare module 'next-auth' {
  interface User {
    role: string
    phone?: string | null
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      phone?: string | null
    }
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Redirect auth errors to login page
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        console.log('🔐 Authorize called with:', { 
          email: credentials?.email, 
          password: credentials?.password ? '***' : 'missing',
          credentialsType: typeof credentials,
          credentialsKeys: Object.keys(credentials || {})
        })
        
        try {
          const validatedFields = loginSchema.safeParse(credentials)

          if (!validatedFields.success) {
            console.log('❌ Validation failed:', validatedFields.error.issues)
            return null
          }

          const { email, password } = validatedFields.data

          console.log('🔍 Looking up user:', email)
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) {
            console.log('❌ User not found:', email)
            return null
          }

          if (!user.password) {
            console.log('❌ User has no password:', email)
            return null
          }

          console.log('🔑 Comparing passwords for:', email)
          console.log('🔑 Password length:', password.length, 'Hash length:', user.password.length)
          
          const passwordsMatch = await comparePasswords(password, user.password)

          if (!passwordsMatch) {
            console.log('❌ Password mismatch for:', email)
            return null
          }

          console.log('✅ Login successful for:', email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            phone: user.phone,
          }
        } catch (error) {
          console.error('💥 Authorize error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user }) {
      try {
        console.log('🔑 JWT callback:', { 
          tokenSub: token.sub, 
          userId: user?.id, 
          userEmail: user?.email,
          tokenEmail: token.email 
        })
        // Persist the role and phone in the token right after signin
        if (user) {
          token.role = user.role
          token.phone = user.phone
        }
        return token
      } catch (error) {
        console.error('🚨 JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        console.log('🎫 Session callback:', { 
          tokenSub: token.sub, 
          tokenEmail: token.email,
          sessionEmail: session.user.email 
        })
        // With JWT strategy, use token data
        if (token) {
          session.user.id = token.sub as string
          session.user.role = (token.role as string) || 'CUSTOMER'
          session.user.phone = token.phone as string || null
        }
        
        return session
      } catch (error) {
        console.error('🚨 Session callback error:', error)
        return session
      }
    },
    async signIn({ user, account, profile }) {
      if (user?.id) {
        try {
          // For OAuth providers, ensure user has proper role
          if (account?.provider !== 'credentials') {
            const existingUser = await prisma.user.findUnique({
              where: { id: user.id }
            })
            
            // Set default role for OAuth users if not already set
            if (existingUser && !existingUser.role) {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: 'CUSTOMER' }
              })
              user.role = 'CUSTOMER'
            } else if (existingUser) {
              user.role = existingUser.role
            }
          }

          // Log login activity to audit log
          await auditLog.login(user.id, {
            email: user.email,
            name: user.name,
            role: user.role,
            provider: account?.provider || 'credentials',
            timestamp: new Date().toISOString()
          })

          console.log(`[AUTH] User ${user.name} signed in via ${account?.provider || 'credentials'}`);
        } catch (error) {
          console.error('Failed to log login activity:', error)
        }
      }
      return true
    },
  },
  events: {
    async session(message) {
      // Event fired when session is accessed
      console.log('[AUTH] Session accessed:', message.session?.user?.email)
    },
    async createUser(message) {
      // Event fired when user is created
      console.log('[AUTH] User created:', message.user.email)
      
      try {
        console.log(`[AUTH] New user created: ${message.user.name}`);
      } catch (error) {
        console.error('Failed to emit user creation event:', error)
      }
    },
    async signOut(message) {
      const token = 'token' in message ? message.token : null
      const userId = token?.sub
      
      if (userId) {
        try {
          // Log logout activity to audit log
          await auditLog.logout(userId)

          console.log(`[AUTH] User ${token?.name} signed out`);
        } catch (error) {
          console.error('Failed to log logout activity:', error)
        }
      }
    },
  },
} satisfies NextAuthConfig
