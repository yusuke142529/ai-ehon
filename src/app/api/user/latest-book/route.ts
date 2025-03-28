// src/app/api/user/latest-book/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/user/latest-book
 * 現在ログイン中のユーザーの最新の絵本を取得する
 * - 生成中にスリープした場合の復帰確認用
 */
export async function GET() {
    try {
        // 認証チェック
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 最新の作成された絵本を取得（最大30分以内のもの）
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

        const latestBook = await prisma.book.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: thirtyMinutesAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                createdAt: true
            }
        });

        return NextResponse.json(latestBook || null);
    } catch (error) {
        console.error("[GET /api/user/latest-book]", error);
        let message = "Internal Server Error";
        if (error instanceof Error) {
            message = error.message;
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}