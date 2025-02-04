// src/lib/auth.ts
import type { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prismadb";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // === Googleログイン ===
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // === メール+パスワード (Credentials) ===
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // (A) 入力チェック
          if (!credentials?.email || !credentials?.password) {
            throw new Error("メールとパスワードを入力してください");
          }

          // (B) DBからユーザーを検索 (deletedAtも取得)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              iconUrl: true,
              hashedPassword: true,
              deletedAt: true,  // ★ 論理削除の有無をチェック
            },
          });
          if (!user || !user.hashedPassword) {
            throw new Error("ユーザーが存在しないか、パスワードが未設定です");
          }

          // ★ 論理削除済みならログイン不可
          if (user.deletedAt) {
            throw new Error("退会済みのユーザーです。");
          }

          // (C) bcrypt でハッシュ比較
          const isValid = await compare(credentials.password, user.hashedPassword);
          if (!isValid) {
            throw new Error("パスワードが間違っています");
          }

          // (D) 認証成功 => session.user に渡す情報
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.iconUrl,
          };
        } catch (err: any) {
          throw new Error(err.message || "認証に失敗しました");
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30日
  },

  callbacks: {
    // (1) GoogleなどOAuthログインで退会ユーザーを弾く
    async signIn({ user, account, profile }) {
      // CredentialsProviderの場合は上記authorize()ですでに弾いているが、
      // GoogleProviderの場合はここでDB照会＆チェックする
      if (account.provider === "google" && user.email) {
        // DBでdeletedAtを確認
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { deletedAt: true },
        });
        if (dbUser?.deletedAt) {
          // 退会済み => ログイン拒否
          return false;
        }
      }
      return true; // 通常通りログイン許可
    },

    // (2) JWTコールバック
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // (3) sessionコールバック
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};