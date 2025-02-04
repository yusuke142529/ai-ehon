//src/app/[locale]/samples/page.tsx

import { prisma } from "@/lib/prismadb";
import SamplesClient from "@/components/SamplesClient";

/**
 * DBから isSample=true & isPublished=true の絵本を取得
 * => SamplesClient.tsx に渡す
 */
async function getSampleBooks() {
  return prisma.book.findMany({
    where: {
      isSample: true,
      isPublished: true
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      pages: {
        select: { pageNumber: true, imageUrl: true },
        orderBy: { pageNumber: "asc" },
        take: 1
      }
    }
  });
}

export default async function SamplesPage() {
  const sampleBooks = await getSampleBooks();
  return <SamplesClient sampleBooks={sampleBooks} />;
}