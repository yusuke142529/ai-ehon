// src/app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { hash } from "bcrypt";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();
        if (!token || !newPassword) {
            return NextResponse.json(
                { error: "トークンまたはパスワードが不足しています" },
                { status: 400 }
            );
        }

        // トークンを検索
        const tokenRecord = await prisma.verificationToken.findUnique({
            where: { token },
        });
        if (!tokenRecord) {
            return NextResponse.json(
                { error: "無効なトークンです" },
                { status: 400 }
            );
        }

        // 有効期限チェック
        if (tokenRecord.expires < new Date()) {
            return NextResponse.json(
                { error: "トークンの有効期限が切れています" },
                { status: 400 }
            );
        }

        // ユーザー特定
        const user = await prisma.user.findUnique({
            where: { email: tokenRecord.identifier },
        });
        if (!user) {
            return NextResponse.json(
                { error: "ユーザーが見つかりません" },
                { status: 404 }
            );
        }

        // パスワード更新 (bcryptハッシュ)
        const hashedPassword = await hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                hashedPassword,
            },
        });

        // 使用済みトークンは削除
        await prisma.verificationToken.delete({
            where: { token },
        });

        // (オプション) パスワードリセット完了メールを送るならここで sendMail() を呼ぶ

        return NextResponse.json(
            { message: "パスワードをリセットしました。" },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
