// src/app/api/ehon/[id]/community/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

// POST /api/ehon/[id]/community
// => 絵本をコミュニティに投稿 (isPublished=true, isCommunity=true)
export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const bookId = Number(params.id);
    if (!bookId) {
        return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // TODO: 認証ユーザーが book.userId と一致するかチェック

    await prisma.book.update({
        where: { id: bookId },
        data: {
            isPublished: true,
            publishedAt: new Date(),
            isCommunity: true,
            communityAt: new Date(),
        },
    });

    return NextResponse.json({ success: true });
}