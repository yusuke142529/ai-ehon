import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

/**
 * /api/user/link-oauth
 *  - GET: 現在ログイン中のユーザーのAccount情報一覧 (Google連携等)
 *  - DELETE: ?provider=google → 該当アカウント削除
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ accounts: [] }, { status: 200 });
  }

  // userId は string
  const userId = session.user.id;

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      providerAccountId: true,
      type: true,
    },
  });

  return NextResponse.json({ accounts }, { status: 200 });
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    if (!provider) {
      return NextResponse.json({ error: "provider is required." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userId = session.user.id;

    // 該当アカウントを削除
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
    });
    if (!account) {
      return NextResponse.json({ error: "アカウントが存在しません" }, { status: 404 });
    }

    await prisma.account.delete({
      where: { id: account.id },
    });

    return NextResponse.json({ message: `${provider} をアンリンクしました` }, { status: 200 });
  } catch (error: unknown) {
    console.error("[link-oauth DELETE]", error);

    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}