// src/lib/serverCheck.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

/**
 * 戻り値:
 *  - 成功時: { user: { id: string }, error: null, status: 200 }
 *  - 失敗時: { error: string, status: number }
 */
export type EnsureActiveUserResult =
  | {
      user: { id: string };
      error: null;
      status: 200;
    }
  | {
      user?: undefined;
      error: string;
      status: number;
    };

/**
 * ensureActiveUser
 * - 未ログイン => 401
 * - user行なし => 404
 * - deletedAt != null(退会済み) => 403
 * - 正常 => user.id を返す
 */
export async function ensureActiveUser(): Promise<EnsureActiveUserResult> {
  // 1) getServerSession でセッション取得
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  // 2) userId は string(UUID) のまま扱う
  const userIdStr = session.user.id;

  // 3) DBでユーザーを検索 (deletedAt確認用)
  //    Prisma スキーマでは User.id は string なので
  const user = await prisma.user.findUnique({
    where: { id: userIdStr },
    select: {
      id: true,
      deletedAt: true,
    },
  });
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // 4) 退会済み
  if (user.deletedAt) {
    return { error: "User is deleted", status: 403 };
  }

  // 5) 正常 => user.id (string) を返す
  return {
    user: { id: user.id },
    error: null,
    status: 200,
  };
}