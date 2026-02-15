-- CreateTable
CREATE TABLE "Employer" (
    "id" SERIAL NOT NULL,
    "tipoSoggetto" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognomeRagione" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "indirizzoLavoro" TEXT NOT NULL,
    "preferenzeNotifica" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "dataNascita" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "documentiIdentita" TEXT NOT NULL,
    "iban" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "employerId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "tipoRapporto" TEXT NOT NULL,
    "livello" TEXT NOT NULL,
    "mansione" TEXT NOT NULL,
    "convivenzaFlag" BOOLEAN NOT NULL,
    "oreSettimanali" DOUBLE PRECISION NOT NULL,
    "retribuzioneBase" DOUBLE PRECISION NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3),
    "statoContratto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "oreOrdinarie" DOUBLE PRECISION NOT NULL,
    "oreStraordinario" DOUBLE PRECISION NOT NULL,
    "causale" TEXT NOT NULL,
    "note" TEXT,
    "validatoFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employer_codiceFiscale_key" ON "Employer"("codiceFiscale");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_codiceFiscale_key" ON "Worker"("codiceFiscale");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_contractId_data_key" ON "Attendance"("contractId", "data");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
