-- CreateTable
CREATE TABLE "PageImage" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdopted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PageImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PageImage" ADD CONSTRAINT "PageImage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
