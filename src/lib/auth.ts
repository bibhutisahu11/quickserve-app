import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          include: { org: true },
        });

        if (!admin) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        );

        if (!passwordMatch) return null;

        // Block login if the org is inactive (Super Admins have no org, so they are exempt)
        if (admin.role !== "SUPER_ADMIN" && admin.org && !admin.org.active) {
          throw new Error("OrgInactive");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name ?? admin.email,
          role: admin.role,
          orgId: admin.orgId ?? null,
          orgSlug: admin.org?.slug ?? null,
          orgName: admin.org?.name ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as { role: string; orgId: string | null; orgSlug: string | null; orgName: string | null };
        token.role = u.role;
        token.orgId = u.orgId;
        token.orgSlug = u.orgSlug;
        token.orgName = u.orgName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.orgSlug = (token.orgSlug as string | null) ?? null;
        session.user.orgName = (token.orgName as string | null) ?? null;
      }
      return session;
    },
  },
};
