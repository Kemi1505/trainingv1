-- CreateEnum
CREATE TYPE "CourseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" TEXT,
ADD COLUMN     "difficulty" "CourseDifficulty" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requiresPreviousCertification" BOOLEAN NOT NULL DEFAULT false;
