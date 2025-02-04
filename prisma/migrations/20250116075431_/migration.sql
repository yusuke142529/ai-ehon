-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "artStyle" JSONB,
ADD COLUMN     "characters" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "targetAge" TEXT,
ADD COLUMN     "theme" TEXT;
