/*
  Warnings:

  - You are about to drop the column `pictureUrl` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "pictureUrl",
ADD COLUMN     "pictureData" BYTEA,
ADD COLUMN     "pictureMime" TEXT,
ADD COLUMN     "pictureName" TEXT;
