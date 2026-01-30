import NextAuth, { type AuthOptions, type Session, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { JWT } from "next-auth/jwt";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

const INVALID_CREDENTIALS_ERROR = "Credenciales inválidas";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 días

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@correo.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        const email = credentials.email.toString().toLowerCase().trim();
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password.toString(),
          user.password
        );

        if (!passwordMatch) {
          throw new Error(INVALID_CREDENTIALS_ERROR);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Actualizar token cada 24 horas
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User & { role?: string } }) {
      // En el login inicial, user objeto está disponible
      if (user) {
        token.id = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        const userWithRole = user as { role?: string };
        token.role = userWithRole.role ?? token.role ?? "USER";
      }
      
      // Verificar que el usuario siga siendo válido en la BD (en cada refresh)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, email: true, name: true, role: true },
        });
        
        if (!dbUser) {
          // Usuario fue eliminado, invalidar token
          return {};
        }
        
        // Actualizar información del usuario por si cambió
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser.role;
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  logger: {
    error: (code, metadata) => {
      console.error(`Auth error [${code}]:`, metadata);
    },
  },
};

export const handler = NextAuth(authConfig);

