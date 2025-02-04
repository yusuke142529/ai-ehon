// src/app/api/user/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { hash } from "bcryptjs";
import zxcvbn from "zxcvbn";
import { sendRegistrationEmail } from "@/lib/sendRegistrationEmail";

interface RegisterRequestBody {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

/**
 * POST /api/user/register
 * Body: { email, password, confirmPassword, name }
 *
 * - 新規ユーザー作成 (deletedAt=null)
 * - 初回ポイント(100)付与
 * - point_History に reason="signup" で記録
 * - 「既存ユーザーが deletedAt != null」なら再登録(復活), ポイント付与なし
 * - 登録完了メールを送信
 */
export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, name }: RegisterRequestBody =
      await request.json();

    // 1) バリデーション
    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        { error: "メール・パスワード・パスワード確認・名前は必須です" },
        { status: 400 }
      );
    }

    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "名前は50文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "パスワードが一致しません" },
        { status: 400 }
      );
    }

    // 2) パスワード強度チェック (zxcvbn)
    const { score } = zxcvbn(password);
    if (score < 3) {
      return NextResponse.json(
        { error: "パスワードが脆弱です。より複雑なパスワードを使用してください" },
        { status: 400 }
      );
    }

    // 3) 既存ユーザー検索
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 3-1) 既に active (deletedAt = null) なユーザーがいる場合
    if (existingUser && !existingUser.deletedAt) {
      return NextResponse.json(
        { error: "メールアドレスは既に使用されています。" },
        { status: 400 }
      );
    }

    // 3-2) 退会済みユーザー → 再登録（復活）
    if (existingUser && existingUser.deletedAt) {
      // パスワードハッシュ
      const hashed = await hash(password, 10);

      // 再登録: deletedAtをnullに戻し、パスワードを更新、ポイント付与しない
      const reactivatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword: hashed,
          name,
          deletedAt: null,
          // pointsはそのまま再利用(前回退会時に0にしているor残っている) 
          // → 仕様によって要調整
        },
      });

      // (任意) point_Historyに「再登録」理由を記録しても良い
      /*
      await prisma.point_History.create({
        data: {
          userId: reactivatedUser.id,
          changeAmount: 0,
          reason: "reactivated",
        },
      });
      */

      // 再登録完了メール送るかどうかは要件次第
      try {
        await sendRegistrationEmail(reactivatedUser.email, reactivatedUser.name);
      } catch (e) {
        console.error("[REGISTER] 再登録メール送信エラー:", e);
      }

      return NextResponse.json(
        {
          user: {
            id: reactivatedUser.id,
            email: reactivatedUser.email,
            name: reactivatedUser.name,
            points: reactivatedUser.points,
          },
          message: "再登録が完了しました",
        },
        { status: 200 }
      );
    }

    // 4) 完全新規 → 初回ポイント付与 + signup履歴
    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      // 4-1) user作成
      const created = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name,
          points: 100,        // ★ 初回付与
          deletedAt: null,
        },
      });

      // 4-2) point_History に "signup" で +100
      await tx.point_History.create({
        data: {
          userId: created.id,
          changeAmount: 100,
          reason: "signup",
        },
      });

      return created;
    });

    // 5) 登録完了メール送信
    try {
      await sendRegistrationEmail(newUser.email, newUser.name);
    } catch (mailError) {
      console.error("[REGISTER] メール送信エラー:", mailError);
      // 登録自体は成功とみなす
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          points: newUser.points,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/user/register] Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}