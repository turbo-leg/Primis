import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      name?: string | null
      email: string
      image?: string | null
      role: string
    }
  }

  interface User extends DefaultUser {
    id: string
    name?: string | null
    email: string
    image?: string | null
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
  }
}
