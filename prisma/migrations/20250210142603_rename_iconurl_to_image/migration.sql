/*
  Warnings:

  - You are about to drop the column `icon_url` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "icon_url",
ADD COLUMN     "image" TEXT;
