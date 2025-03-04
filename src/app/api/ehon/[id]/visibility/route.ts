export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";
import { BookStatus } from "@prisma/client"; // BookStatus 列挙型をインポート

/**
 * 絵本の公開ステータスを変更するAPI
 * POST /api/ehon/[id]/visibility
 * Body: { status: string }
 */
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1) 認証と権限チェック
        const check = await ensureActiveUser();
        if (check.error || !check.user) {
            return NextResponse.json(
                { error: check.error || "Unauthorized" },
                { status: check.status || 401 }
            );
        }

        const userId = check.user.id;
        const bookId = Number(params.id);

        if (Number.isNaN(bookId)) {
            return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
        }

        // 2) 絵本の所有権確認
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: { userId: true },
        });

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        if (book.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3) リクエストボディからステータスを取得
        const { status } = await req.json();

        // 文字列からBookStatus列挙型への変換
        let bookStatus: BookStatus;
        switch (status) {
            case "PRIVATE":
                bookStatus = BookStatus.PRIVATE;
                break;
            case "PUBLISHED":
                bookStatus = BookStatus.PUBLISHED;
                break;
            case "COMMUNITY":
                bookStatus = BookStatus.COMMUNITY;
                break;
            case "PUBLIC":
                bookStatus = BookStatus.PUBLIC;
                break;
            default:
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // 4) 適切なタイムスタンプを設定
        interface BookUpdateData {
            status: BookStatus;
            isPublished?: boolean;
            publishedAt?: Date | null;
            isCommunity?: boolean;
            communityAt?: Date | null;
        }

        const now = new Date();
        const data: BookUpdateData = { status: bookStatus };

        if (status === "PUBLIC" || status === "COMMUNITY" || status === "PUBLISHED") {
            data.isPublished = true;
            data.publishedAt = data.publishedAt || now;

            if (status === "COMMUNITY") {
                data.isCommunity = true;
                data.communityAt = data.communityAt || now;
            }
        }

        // 5) データベース更新
        await prisma.book.update({
            where: { id: bookId },
            data
        });

        return NextResponse.json({
            success: true,
            message: `Book status updated to ${status}`
        });
    } catch (error) {
        console.error("Error in visibility update:", error);
        let message = "Internal Server Error";
        if (error instanceof Error) {
            message = error.message;
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}