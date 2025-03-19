// src/app/api/user/register/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { hash } from "bcrypt";
import { validatePasswordServer } from "@/lib/serverPasswordValidation";
import crypto from "crypto";
// sendRegistrationEmailを引き続き使用（内部実装がSendGrid対応されている）
import { sendRegistrationEmail } from "@/lib/sendRegistrationEmail";

interface RegisterRequestBody {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, name } =
      (await request.json()) as RegisterRequestBody;

    // 1) 入力バリデーション
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

    // 2) パスワード強度チェック
    const passwordError = validatePasswordServer(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // 3) ユーザー検索
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 3-1) 既にactiveなユーザー
    if (existingUser && !existingUser.deletedAt) {
      return NextResponse.json(
        { error: "メールアドレスは既に使用されています。" },
        { status: 400 }
      );
    }

    // 3-2) 退会ユーザー => 再登録フロー (メール認証を再度行う)
    if (existingUser && existingUser.deletedAt) {
      const hashed = await hash(password, 10);

      // userを復活しつつ、emailVerified=nullに
      const reactivatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword: hashed,
          name,
          deletedAt: null,
          emailVerified: null,
        },
      });

      // verificationTokenを発行
      const tokenValue = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.verificationToken.create({
        data: {
          identifier: reactivatedUser.email,
          token: tokenValue,
          expires,
        },
      });

      // 認証メール送信 - 内部でSendGridを使用
      try {
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${tokenValue}`;
        await sendRegistrationEmail(
          reactivatedUser.email,
          reactivatedUser.name!,
          verifyUrl
        );
      } catch (err: unknown) {
        console.error("[RE-REGISTER] 再登録メール送信エラー:", err);
      }

      return NextResponse.json(
        {
          user: {
            id: reactivatedUser.id,
            email: reactivatedUser.email,
            name: reactivatedUser.name,
            points: reactivatedUser.points,
          },
          message: "再登録（仮）が完了しました。メールをご確認ください。",
        },
        { status: 200 }
      );
    }

    // 4) 完全新規 => 初回ポイント + signup履歴
    const hashedPassword = await hash(password, 10);
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name,
          points: 100,
          deletedAt: null,
          emailVerified: null, // Verified -> emailVerified に修正（誤字修正）
        },
      });
      await tx.pointHistory.create({
        data: {
          userId: created.id,
          changeAmount: 100,
          reason: "signup",
        },
      });
      return created;
    });

    // verificationToken 作成
    const tokenValue = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: {
        identifier: newUser.email,
        token: tokenValue,
        expires,
      },
    });

    // 認証用メール送信 - 内部でSendGridを使用
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${tokenValue}`;
      await sendRegistrationEmail(newUser.email, newUser.name!, verifyUrl);
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
        message: "仮登録が完了しました。メールをご確認ください。",
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