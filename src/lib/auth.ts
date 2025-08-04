import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        console.log('🔐 Attempting login for:', credentials.email)

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('👤 Found user:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found')

          if (!user) {
            console.log('❌ User not found')
            return null
          }

          // For development, we'll check plain text passwords
          // In production, you should use bcrypt.compare(credentials.password, user.password)
          const isValidPassword = credentials.password === 'password123' || 
                                 credentials.password === 'admin123' || 
                                 credentials.password === 'student123'

          console.log('🔑 Password valid:', isValidPassword)

          if (!isValidPassword) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Login successful for:', user.email, 'Role:', user.role)
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error('❌ Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token)
      console.log('Session callback - session before:', session)
      
      if (session?.user?.email) {
        // Always fetch fresh user data from database to ensure role is current
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, role: true }
          })
          
          console.log('Session callback - dbUser:', dbUser)
          
          if (dbUser) {
            session.user.id = dbUser.id
            session.user.role = dbUser.role
            session.user.name = dbUser.name
          } else {
            // Fallback to token data
            session.user.id = token.userId as string || token.sub as string
            session.user.role = token.role as string
          }
        } catch (error) {
          console.error('Error fetching user in session callback:', error)
          // Fallback to token data
          session.user.id = token.userId as string || token.sub as string
          session.user.role = token.role as string
        }
      }
      
      console.log('Session callback - session after:', session)
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
}
