/*
  Warnings:

  - You are about to drop the column `type` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `ContentItem` table. All the data in the column will be lost.
  - You are about to drop the column `certificateUrl` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `fileData` to the `ContentItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `ContentItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `ContentItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContentItem" DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN     "fileData" BYTEA NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "certificateUrl",
ADD COLUMN     "certificateFile" BYTEA,
ADD COLUMN     "certificateMime" TEXT,
ADD COLUMN     "certificateName" TEXT;
