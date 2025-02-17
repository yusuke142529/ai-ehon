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

        // (B) DBからユーザーを検索
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            hashedPassword: true,
            deletedAt: true,
            emailVerified: true, // ★ メール認証フラグ
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("ユーザーが存在しないか、パスワードが未設定です");
        }

        // (C) 退会済みチェック
        if (user.deletedAt) {
          throw new Error("退会済みのユーザーです。再有効化ページをご利用ください。");
        }

        // (D) bcrypt でパスワード照合
        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("パスワードが間違っています");
        }

        // (E) メール認証チェック
        if (!user.emailVerified) {
          // Credentials ログイン時は必須とする場合
          throw new Error("EmailNotVerified");
        }

        // (F) 認証成功
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        } satisfies User;
      },
    }),
  ],

  pages: {
    signIn: "/ja/auth/login", // ログインページ
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
     *  1) ユーザーが見つからない ⇒ 新規作成 (デフォルト動作)
     *  2) ユーザーが deletedAt != null ⇒ /ja/auth/reactivate に誘導
     *  3) ユーザーが emailVerified=null ⇒ ここで強制的に更新 or エラーを返す
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Googleログイン時: email 取得失敗なら OAuthAccountNotLinked
        if (!user || !user.email) {
          return "/ja/auth/login?error=OAuthAccountNotLinked";
        }

        // DBユーザー取得
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            deletedAt: true,
            emailVerified: true,
          },
        });

        // 退会済み
        if (dbUser?.deletedAt) {
          return `/ja/auth/reactivate?email=${user.email}`;
        }

        // ★ もし emailVerified が null の場合、強制的にセットしてログイン許可する
        //   => "Googleログインではメール認証不要" の方針
        if (dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() },
          });
        }

        // これで "EmailNotVerified" にはさせない
      }

      // Credentials プロバイダの場合は authorize() 側で判定済み
      return true;
    },

    // JWTコールバック
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // string
      }
      return token;
    },

    // Sessionコールバック
    async session({ session, token }) {
      if (session.user && typeof token.id !== "undefined") {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  events: {
    /**
     * OAuth で新規ユーザーが作成された時
     * - Googleログイン時はここでも emailVerified = new Date() をセット可能
     * - ただし createUser の引数に account は存在しない (NextAuth v4)
     *   => Googleで作成されたかどうかは DB の accounts テーブルを調べて判定
     */
    async createUser({ user }) {
      console.log("[NextAuth] New user created:", user.id, user.email);

      // 新しく作成された user に紐づくアカウント情報を検索
      // provider: "google" があれば Googleログインの新規ユーザー
      const googleAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "google",
        },
      });

      if (googleAccount) {
        // ★ Googleログインで新規作成されたユーザー
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            points: 100, // ここでポイント付与
          },
        });
        // pointHistory += 100
        await prisma.pointHistory.create({
          data: {
            userId: user.id,
            changeAmount: 100,
            reason: "signup",
          },
        });
      } else {
        // その他 (Credentialsログイン など)
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
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
