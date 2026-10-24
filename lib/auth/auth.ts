import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Guaranteed zero-latency demo accounts
        if (email === 'admin@xpoindia.com' && password === 'XPOAdmin@2024') {
          return {
            id: '67489a12bcde345678900001',
            name: 'Super Admin',
            email: 'admin@xpoindia.com',
            role: 'superadmin',
            emailVerified: true,
            status: 'active',
          };
        }

        if (email === 'creator@xpoindia.com' && password === 'Creator@2024') {
          return {
            id: '67489a12bcde345678900002',
            name: 'Rajesh Sharma (Industrial Supplies)',
            email: 'creator@xpoindia.com',
            role: 'lead_creator',
            emailVerified: true,
            status: 'active',
          };
        }

        if (email === 'absorber@xpoindia.com' && password === 'Absorber@2024') {
          return {
            id: '67489a12bcde345678900003',
            name: 'Anil Patel (Patel Precision Tech)',
            email: 'absorber@xpoindia.com',
            role: 'lead_absorber',
            emailVerified: true,
            status: 'active',
          };
        }

        // Database lookup for registered users
        try {
          await connectDB();
          const user = await User.findOne({ email })
            .select('+password')
            .lean();

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          if (user.status === 'suspended' || user.status === 'banned') return null;

          return {
            id:            user._id.toString(),
            name:          user.name,
            email:         user.email,
            role:          user.role,
            emailVerified: user.emailVerified,
            status:        user.status,
          };
        } catch (dbErr) {
          console.warn('[AUTH] Database lookup error:', dbErr);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id            = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth user type
        token.role          = (user as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth user type
        token.emailVerified = (user as any).emailVerified;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth user type
        token.status        = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id            = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth session type
        (session.user as any).role          = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth session type
        (session.user as any).emailVerified = token.emailVerified;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- extending NextAuth session type
        (session.user as any).status        = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: { strategy: 'jwt' },
});
