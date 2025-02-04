-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "communityAt" TIMESTAMP(3),
ADD COLUMN     "isCommunity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
