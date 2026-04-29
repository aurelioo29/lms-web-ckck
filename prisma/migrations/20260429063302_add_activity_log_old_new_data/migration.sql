-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "newData" JSONB,
ADD COLUMN     "oldData" JSONB;
