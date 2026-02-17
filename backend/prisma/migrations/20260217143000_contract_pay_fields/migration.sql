-- AlterTable
ALTER TABLE "Contract"
    ALTER COLUMN "payType" SET DEFAULT 'HOURLY',
    ADD COLUMN "hourlyRate" DECIMAL(10,2),
    ADD COLUMN "monthlySalary" DECIMAL(10,2),
    ADD COLUMN "overtimeMultiplier" DECIMAL(10,2) NOT NULL DEFAULT 1.25;
