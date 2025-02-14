// src/app/api/user/register/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
// --- bcryptjs → bcrypt に変更 ---
import { hash } from "bcrypt";
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
 * - pointHistory に reason="signup" で記録
 * - 「既存ユーザーが deletedAt != null」なら再登録(復活), ポイント付与なし
 * - 登録完了メールを送信
 */
export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      confirmPassword,
      name,
    } = (await request.json()) as RegisterRequestBody;

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

    // 3-1) 既に active (deletedAt = null) なユーザー
    if (existingUser && !existingUser.deletedAt) {
      return NextResponse.json(
        { error: "メールアドレスは既に使用されています。" },
        { status: 400 }
      );
    }

    // 3-2) 退会済みユーザー → 再登録（復活）
    if (existingUser && existingUser.deletedAt) {
      const hashed = await hash(password, 10);

      // 再登録: deletedAtをnullに戻し、パスワードを更新（ポイント付与なし）
      const reactivatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword: hashed,
          name,
          deletedAt: null,
        },
      });

      // 再登録完了メール
      try {
        await sendRegistrationEmail(
          reactivatedUser.email ?? "",
          reactivatedUser.name ?? ""
        );
      } catch (e: unknown) {
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
      // user作成
      const created = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name,
          points: 100, // 初回付与
          deletedAt: null,
        },
      });

      // pointHistory に "signup" で +100
      await tx.pointHistory.create({
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
      await sendRegistrationEmail(newUser.email ?? "", newUser.name ?? "");
    } catch (mailError: unknown) {
      console.error("[REGISTER] メール送信エラー:", mailError);
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
  } catch (error: unknown) {
    console.error("[POST /api/user/register] Error:", error);

    let msg = "サーバーエラーが発生しました";
    if (error instanceof Error) {
      msg = error.message;
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
