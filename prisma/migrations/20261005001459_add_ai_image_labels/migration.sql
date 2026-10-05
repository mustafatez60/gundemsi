-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ArticleBlock" ADD COLUMN     "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;
