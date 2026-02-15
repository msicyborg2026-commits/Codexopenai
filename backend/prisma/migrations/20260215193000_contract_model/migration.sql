-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('COLF', 'BADANTE_CONVIVENTE', 'BADANTE_NON_CONVIVENTE');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('HOURLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Contract"
    ADD COLUMN "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "contractType" "ContractType" NOT NULL DEFAULT 'COLF',
    ADD COLUMN "level" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "convivente" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "endDate" TIMESTAMP(3),
    ADD COLUMN "probationMonths" INTEGER,
    ADD COLUMN "weeklyHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "monHours" DECIMAL(10,2),
    ADD COLUMN "tueHours" DECIMAL(10,2),
    ADD COLUMN "wedHours" DECIMAL(10,2),
    ADD COLUMN "thuHours" DECIMAL(10,2),
    ADD COLUMN "friHours" DECIMAL(10,2),
    ADD COLUMN "satHours" DECIMAL(10,2),
    ADD COLUMN "sunHours" DECIMAL(10,2),
    ADD COLUMN "payType" "PayType" NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN "baseSalary" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "superminimo" DECIMAL(10,2),
    ADD COLUMN "foodAllowance" DECIMAL(10,2),
    ADD COLUMN "accommodationAllowance" DECIMAL(10,2),
    ADD COLUMN "thirteenth" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "tfrAccrualRate" DECIMAL(10,4),
    ADD COLUMN "calculatedGrossMonthly" DECIMAL(10,2),
    ADD COLUMN "calculatedInps" DECIMAL(10,2),
    ADD COLUMN "calculatedTotalCost" DECIMAL(10,2),
    ADD COLUMN "notes" TEXT;

-- DataMigration
UPDATE "Contract"
SET
    "status" = CASE
        WHEN LOWER("statoContratto") = 'attivo' THEN 'ACTIVE'::"ContractStatus"
        WHEN LOWER("statoContratto") = 'chiuso' THEN 'CLOSED'::"ContractStatus"
        ELSE 'DRAFT'::"ContractStatus"
    END,
    "contractType" = CASE
        WHEN LOWER("mansione") LIKE '%badante%' AND "convivenzaFlag" = true THEN 'BADANTE_CONVIVENTE'::"ContractType"
        WHEN LOWER("mansione") LIKE '%badante%' THEN 'BADANTE_NON_CONVIVENTE'::"ContractType"
        ELSE 'COLF'::"ContractType"
    END,
    "level" = "livello",
    "convivente" = "convivenzaFlag",
    "startDate" = "dataInizio",
    "endDate" = "dataFine",
    "weeklyHours" = "oreSettimanali"::DECIMAL(10,2),
    "baseSalary" = "retribuzioneBase"::DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Contract"
    DROP COLUMN "tipoRapporto",
    DROP COLUMN "livello",
    DROP COLUMN "mansione",
    DROP COLUMN "convivenzaFlag",
    DROP COLUMN "oreSettimanali",
    DROP COLUMN "retribuzioneBase",
    DROP COLUMN "dataInizio",
    DROP COLUMN "dataFine",
    DROP COLUMN "statoContratto";

-- AlterTable
ALTER TABLE "Contract"
    ALTER COLUMN "level" DROP DEFAULT,
    ALTER COLUMN "startDate" DROP DEFAULT,
    ALTER COLUMN "weeklyHours" DROP DEFAULT,
    ALTER COLUMN "baseSalary" DROP DEFAULT;
