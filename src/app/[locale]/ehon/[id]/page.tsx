import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import EditBookClient from "./EditBookClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EhonDetailPage({ params }: { params: { id: string } }) {
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return <div>無効なIDが指定されました</div>;
  }

  // セッション取得
  const session = await getServerSession(authOptions);
  if (!session) {
    return <div>ログインしてください</div>;
  }
  const sessionUserId = Number(session.user.id);

  // Book + pages取得
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { pages: true, user: true },
  });
  if (!book) {
    return notFound();
  }

  // 所有者チェック
  if (book.userId !== sessionUserId) {
    return <div>他のユーザーの絵本は編集できません</div>;
  }

  // ここで isPublished のチェックを外したので、完成後も編集可能となる
  // if (book.isPublished) {
  //   return (
  //     <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
  //       <h1>{book.title} はすでに完成済みです。</h1>
  //       <p>編集はできません。閲覧したい場合はビューワーページへどうぞ。</p>
  //     </div>
  //   );
  // }

  // ページ順ソート
  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <EditBookClient
      book={{
        id: book.id,
        title: book.title || "無題の絵本",
        userName: book.user?.name || "",
        isPublished: book.isPublished,
        isCommunity: book.isCommunity,
      }}
      pages={sortedPages.map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        text: p.text || "",
        imageUrl: p.imageUrl || "",
        prompt: p.prompt || "",
      }))}
    />
  );
}