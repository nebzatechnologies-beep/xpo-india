import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/db/models/user.model";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email, isActive: true, isSuspended: false, isBlocked: false, deletedAt: null }).select("+password");
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role, roles: user.roles, image: user.avatar };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; token.roles = (user as any).roles; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).id = token.id as string; (session.user as any).role = token.role as string; (session.user as any).roles = token.roles as string[]; }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        await connectDB();
        await User.findByIdAndUpdate(user.id, { lastLogin: new Date() });
      } catch (e) { /* non-critical */ }
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
