// src/lib/auth.ts

import type { AuthOptions, User } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prismadb";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // ============== Google OAuth ==============
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      /**
       * allowDangerousEmailAccountLinking = false
       *   ⇒ 同じメールアドレスが既存ユーザーにあっても自動リンクしない
       *   ⇒ 通常は手動リンクか、メール被りなら OAuthAccountNotLinked エラーとなる
       */
      allowDangerousEmailAccountLinking: false,
    }),

    // ============== Credentials (メール+パスワード) ==============
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // (A) 入力チェック
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールとパスワードを入力してください");
        }

        // (B) DBからユーザーを検索 (User.id: string)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true, // string (UUID)
            name: true,
            email: true,
            image: true,
            hashedPassword: true,
            deletedAt: true,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("ユーザーが存在しないか、パスワードが未設定です");
        }

        // (C) 退会済みチェック
        if (user.deletedAt) {
          throw new Error("退会済みのユーザーです。再有効化ページをご利用ください。");
        }

        // (D) bcrypt でパスワードチェック
        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("パスワードが間違っています");
        }

        // (E) 認証成功 => NextAuth で使うユーザー情報を返す
        return {
          id: user.id, // user.id は string
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        } satisfies User;
      },
    }),
  ],

  pages: {
    signIn: "/ja/auth/login", // ログインページ
    // error: "/ja/auth/error", // 必要ならカスタムエラーページを指定
  },

  session: {
    strategy: "jwt",
  },

  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30日
  },

  callbacks: {
    /**
     * Googleログイン時:
     *  1) ユーザーが見つからない ⇒ 新規作成 (デフォルト動作, allowDangerousEmailAccountLinking=false でメール一致すれば同一ユーザと認識)
     *  2) ユーザーが deletedAt != null ⇒ /ja/auth/reactivate に誘導
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user || !user.email) {
          // メールアドレス取得できない or allowDangerousEmailAccountLinking=false で衝突
          return "/ja/auth/login?error=OAuthAccountNotLinked";
        }
        // 退会済みチェック
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { deletedAt: true },
        });
        if (dbUser?.deletedAt) {
          // 退会済み ⇒ 再有効化ページへ
          return "/ja/auth/reactivate?email=" + user.email;
        }
      }
      return true;
    },

    // JWTコールバック: ユーザが存在する時だけ token.id に user.id をセット
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // string
      }
      return token;
    },

    // Sessionコールバック: session.user.id に token.id を注入
    async session({ session, token }) {
      if (session.user && typeof token.id !== "undefined") {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  /**
   * ここで NextAuth の "events.createUser" を使うことで、
   * OAuth で新規ユーザーが作成された時にもポイント付与を行う。
   */
  events: {
    async createUser({ user }) {
      // user.id は string (UUID)
      console.log("[NextAuth] New user created:", user.id, user.email);

      // すでにユーザーがある: points=0のまま → +100, pointHistory
      // (退会済み再有効化の場合は createUser ではなく updateUser が呼ばれるので二重にはならない)
      await prisma.$transaction(async (tx) => {
        // 1) user.points = 100
        await tx.user.update({
          where: { id: user.id },
          data: { points: 100 },
        });
        // 2) pointHistory += 100
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            changeAmount: 100,
            reason: "signup",
          },
        });
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;