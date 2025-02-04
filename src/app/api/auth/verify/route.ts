// src/app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenValue = searchParams.get("token");
        if (!tokenValue) {
            return NextResponse.json({ error: "トークンがありません" }, { status: 400 });
        }

        // DBでトークンを検索
        const tokenRecord = await prisma.verificationToken.findUnique({
            where: { token: tokenValue },
        });
        if (!tokenRecord) {
            return NextResponse.json({ error: "無効なトークンです" }, { status: 400 });
        }

        if (tokenRecord.expires < new Date()) {
            return NextResponse.json({ error: "トークンの有効期限が切れています" }, { status: 400 });
        }

        // ユーザーを特定
        const user = await prisma.user.findUnique({
            where: { email: tokenRecord.identifier },
        });
        if (!user) {
            return NextResponse.json({ error: "ユーザーが存在しません" }, { status: 404 });
        }

        // emailVerified を更新
        await prisma.user.update({
            where: { email: user.email },
            data: {
                emailVerified: new Date(),
            },
        });

        // トークン削除
        await prisma.verificationToken.delete({
            where: { token: tokenValue },
        });

        // 完了 => 成功画面 or ログインページへリダイレクト
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?verified=1`);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}