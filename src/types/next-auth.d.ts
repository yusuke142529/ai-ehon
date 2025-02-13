import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * User モデル / セッションの型拡張
 * - session.user.id を使えるようにする (string)
 */

declare module "next-auth" {
  interface Session {
    user?: {
      id: string; // DBのユーザーID (string, UUID)
    } & DefaultSession["user"];
  }

  interface User {
    id: string; // DBのユーザーID (string, UUID)
    // 他のカラムを拡張する場合はここに追加
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string; // JWT 内の id も string
  }
}

export {};