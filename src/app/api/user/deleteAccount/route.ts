// src/app/api/user/deleteAccount/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // 例: next-authの設定

/**
 * DELETE /api/user/deleteAccount
 *  - ログイン中のユーザーを論理削除
 *  - 保有クレジットを0にして失効
 *  - 必要に応じて point_History にマイナスレコードを追加
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // 1) 現在のポイントを取得
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const currentPoints = user.points || 0;

    // 2) 退会 => deletedAt = now, points = 0
    //    さらに point_History に残ポイントをマイナスした履歴を作成
    await prisma.$transaction(async (tx) => {
      if (currentPoints > 0) {
        // 2-1) ポイント失効履歴 (任意)
        await tx.point_History.create({
          data: {
            userId: userId,
            changeAmount: -currentPoints,
            reason: "退会に伴う失効",
          },
        });
      }

      // 2-2) user更新
      await tx.user.update({
        where: { id: userId },
        data: {
          points: 0,
          deletedAt: new Date(),
        },
      });
    });

    // 3) レスポンス
    return NextResponse.json({ message: "退会処理が完了しました" }, { status: 200 });
  } catch (error: any) {
    console.error("[deleteAccount]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}