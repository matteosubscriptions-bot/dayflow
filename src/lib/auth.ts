import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Sign-up on first credential use (personal, single-user app).
          user = await prisma.user.create({
            data: { email, passwordHash: hashPassword(password) },
          });
        } else if (user.passwordHash) {
          if (!verifyPassword(password, user.passwordHash)) return null;
        } else {
          // Account exists without a password (e.g. seed) — set it now.
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashPassword(password) },
          });
        }

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

/** Returns the signed-in user's id, or null. Server-side only. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
