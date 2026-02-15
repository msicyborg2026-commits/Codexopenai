import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.attendance.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.employer.deleteMany();

  const employers = await prisma.$transaction([
    prisma.employer.create({
      data: {
        tipoSoggetto: 'Persona fisica',
        nome: 'Marco',
        cognomeRagione: 'Rossi',
        codiceFiscale: 'RSSMRC80A01H501U',
        email: 'marco.rossi@email.it',
        telefono: '3331112233',
        indirizzoLavoro: 'Via Roma 1, Milano',
        preferenzeNotifica: 'email'
      }
    }),
    prisma.employer.create({
      data: {
        tipoSoggetto: 'Persona fisica',
        nome: 'Laura',
        cognomeRagione: 'Bianchi',
        codiceFiscale: 'BNCLRA82B41F205Z',
        email: 'laura.bianchi@email.it',
        telefono: '3334445566',
        indirizzoLavoro: 'Via Torino 12, Torino',
        preferenzeNotifica: 'whatsapp'
      }
    })
  ]);

  const workers = await prisma.$transaction([
    prisma.worker.create({
      data: {
        nome: 'Ana',
        cognome: 'Popescu',
        codiceFiscale: 'PPSNAA90C51Z129T',
        dataNascita: new Date('1990-03-11'),
        email: 'ana.popescu@email.it',
        telefono: '3391111111',
        documentiIdentita: 'Carta identità AB123456',
        iban: 'IT60X0542811101000000123456'
      }
    }),
    prisma.worker.create({
      data: {
        nome: 'Giulia',
        cognome: 'Verdi',
        codiceFiscale: 'VRDGLI88D62H501B',
        dataNascita: new Date('1988-04-22'),
        email: 'giulia.verdi@email.it',
        telefono: '3392222222',
        documentiIdentita: 'Passaporto YA998877',
        iban: null
      }
    }),
    prisma.worker.create({
      data: {
        nome: 'Mihai',
        cognome: 'Ionescu',
        codiceFiscale: 'NCSMHI85E10Z129P',
        dataNascita: new Date('1985-05-10'),
        email: 'mihai.ionescu@email.it',
        telefono: '3393333333',
        documentiIdentita: 'Carta identità ZZ887766',
        iban: 'IT72P0300203280123456789012'
      }
    })
  ]);

  const contractOne = await prisma.contract.create({
    data: {
      employerId: employers[0].id,
      workerId: workers[0].id,
      status: 'ACTIVE',
      contractType: 'COLF',
      level: 'BS',
      convivente: false,
      startDate: new Date('2025-01-01'),
      probationMonths: 2,
      weeklyHours: 30,
      monHours: 6,
      tueHours: 6,
      wedHours: 6,
      thuHours: 6,
      friHours: 6,
      payType: 'MONTHLY',
      baseSalary: 1200,
      superminimo: 50,
      thirteenth: true,
      tfrAccrualRate: 0.0741,
      calculatedGrossMonthly: 1250,
      calculatedInps: 180,
      calculatedTotalCost: 1430,
      notes: 'Contratto standard colf non convivente.'
    }
  });

  await prisma.contract.create({
    data: {
      employerId: employers[1].id,
      workerId: workers[1].id,
      status: 'ACTIVE',
      contractType: 'BADANTE_CONVIVENTE',
      level: 'CS',
      convivente: true,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-12-31'),
      probationMonths: 1,
      weeklyHours: 40,
      monHours: 8,
      tueHours: 8,
      wedHours: 8,
      thuHours: 8,
      friHours: 8,
      payType: 'MONTHLY',
      baseSalary: 1450,
      foodAllowance: 120,
      accommodationAllowance: 180,
      thirteenth: true,
      tfrAccrualRate: 0.0741,
      calculatedGrossMonthly: 1750,
      calculatedInps: 220,
      calculatedTotalCost: 1970,
      notes: 'Contratto badante convivente a termine.'
    }
  });

  const attendances = [];
  for (let day = 1; day <= 28; day++) {
    const date = new Date(`2025-01-${String(day).padStart(2, '0')}T00:00:00Z`);
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    attendances.push({
      contractId: contractOne.id,
      data: date,
      oreOrdinarie: isWeekend ? 0 : 6,
      oreStraordinario: isWeekend ? 0 : day % 7 === 0 ? 1 : 0,
      causale: isWeekend ? 'permesso' : 'presenza',
      note: isWeekend ? 'Riposo' : null,
      validatoFlag: true
    });
  }

  await prisma.attendance.createMany({ data: attendances });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
