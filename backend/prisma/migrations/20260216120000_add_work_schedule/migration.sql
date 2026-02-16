-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "monMinutes" INTEGER NOT NULL DEFAULT 0,
    "tueMinutes" INTEGER NOT NULL DEFAULT 0,
    "wedMinutes" INTEGER NOT NULL DEFAULT 0,
    "thuMinutes" INTEGER NOT NULL DEFAULT 0,
    "friMinutes" INTEGER NOT NULL DEFAULT 0,
    "satMinutes" INTEGER NOT NULL DEFAULT 0,
    "sunMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_contractId_key" ON "WorkSchedule"("contractId");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
