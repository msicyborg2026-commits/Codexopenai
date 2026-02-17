-- CreateTable
CREATE TABLE "JustificationType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JustificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceJustification" (
    "id" SERIAL NOT NULL,
    "attendanceDayId" INTEGER NOT NULL,
    "justificationTypeId" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceJustification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JustificationType_code_key" ON "JustificationType"("code");

-- AddForeignKey
ALTER TABLE "AttendanceJustification" ADD CONSTRAINT "AttendanceJustification_attendanceDayId_fkey" FOREIGN KEY ("attendanceDayId") REFERENCES "AttendanceDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceJustification" ADD CONSTRAINT "AttendanceJustification_justificationTypeId_fkey" FOREIGN KEY ("justificationTypeId") REFERENCES "JustificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
