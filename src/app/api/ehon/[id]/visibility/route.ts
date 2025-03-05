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
        console.log("[visibility] Starting status update process");
        
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
            select: { 
                userId: true,
                hasBeenPublic: true  // 外部公開の履歴をチェック
            },
        });

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        if (book.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3) リクエストボディからステータスを取得
        const body = await req.json();
        const status = body.status;
        
        console.log(`[visibility] Requested status change: ${status}`);

        if (!status || typeof status !== 'string') {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // 文字列からBookStatus列挙型への変換
        let bookStatus: BookStatus;
        
        try {
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
                    console.log(`[visibility] Invalid status: ${status}`);
                    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
        } catch (err) {
            console.error(`[visibility] Error converting status: ${err}`);
            return NextResponse.json({ 
                error: "Could not convert status",
                details: String(err)
            }, { status: 500 });
        }

        // 4) 外部公開への変更時の特別処理
        if (status === "PUBLIC") {
            console.log(`[visibility] Processing PUBLIC status update`);
            
            try {
                // トランザクションを開始
                await prisma.$transaction(async (tx) => {
                    // 1. 絵本のステータス更新
                    await tx.book.update({
                        where: { id: bookId },
                        data: {
                            status: bookStatus,
                            isPublished: true,
                            publishedAt: new Date(),
                            // 外部公開済みフラグを設定
                            hasBeenPublic: true
                        }
                    });
                    
                    // 2. 初めての外部公開の場合のみポイント付与
                    if (!book.hasBeenPublic) {
                        console.log(`[visibility] First time PUBLIC - adding 50 points`);
                        
                        // ユーザーにポイント付与
                        await tx.user.update({
                            where: { id: userId },
                            data: { points: { increment: 50 } }
                        });
                        
                        // ポイント履歴を記録
                        await tx.pointHistory.create({
                            data: {
                                userId,
                                changeAmount: 50,
                                reason: "public_book_reward",
                                relatedId: bookId
                            }
                        });
                    }
                });
                
                console.log(`[visibility] PUBLIC status update completed successfully`);
                
                return NextResponse.json({
                    success: true,
                    message: `Book status updated to ${status}`,
                    pointsAdded: !book.hasBeenPublic ? 50 : 0
                });
            } catch (txError) {
                console.error(`[visibility] Transaction error: ${txError}`);
                return NextResponse.json({ 
                    error: "Transaction failed", 
                    details: String(txError)
                }, { status: 500 });
            }
        } else {
            // その他のステータス変更（通常の更新処理）
            console.log(`[visibility] Processing ${status} status update`);
            
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

            if (status === "PUBLISHED" || status === "COMMUNITY") {
                data.isPublished = true;
                data.publishedAt = now;

                if (status === "COMMUNITY") {
                    data.isCommunity = true;
                    data.communityAt = now;
                }
            }
            
            try {
                await prisma.book.update({
                    where: { id: bookId },
                    data
                });
                
                console.log(`[visibility] ${status} status update completed successfully`);
                
                return NextResponse.json({
                    success: true,
                    message: `Book status updated to ${status}`
                });
            } catch (updateError) {
                console.error(`[visibility] Update error: ${updateError}`);
                return NextResponse.json({ 
                    error: "Update failed", 
                    details: String(updateError)
                }, { status: 500 });
            }
        }
    } catch (error) {
        console.error(`[visibility] Global error: ${error}`);
        let message = "Internal Server Error";
        if (error instanceof Error) {
            message = error.message;
        }
        return NextResponse.json({ 
            error: message,
            stack: process.env.NODE_ENV !== 'production' ? String(error) : undefined
        }, { status: 500 });
    }
}