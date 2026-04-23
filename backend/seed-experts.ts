import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const experts = [
    {
      name: 'Dr. Sarah Jenkins',
      specialization: 'Postpartum Psychosis Specialist',
      bio: 'Expert in severe postpartum mood disorders with 15 years of experience.',
      isVerified: true,
    },
    {
      name: 'Maria Gonzalez',
      specialization: 'Trauma & Grounding Therapist',
      bio: 'LCSW focusing on birth trauma and somatic experiencing.',
      isVerified: true,
    },
    {
      name: 'Dr. Emily Chen',
      specialization: 'Lactation-Safe Medication Management',
      bio: 'Reproductive psychiatrist specialized in breastfeeding-safe treatments.',
      isVerified: true,
    },
  ];

  for (const expert of experts) {
    const fakeLicenseNo = expert.name.replace(/\s+/g, '-').toLowerCase();
    const fakeEmail = `${fakeLicenseNo}@example.com`;

    await prisma.expert.upsert({
      where: { licenseNo: fakeLicenseNo },
      update: {},
      create: {
        specialization: expert.specialization,
        bio: expert.bio,
        isVerified: expert.isVerified,
        licenseNo: fakeLicenseNo,
        user: {
          connectOrCreate: {
            where: { email: fakeEmail },
            create: {
              fullName: expert.name,
              email: fakeEmail,
              passwordHash: 'dummy_hash_for_seeded_expert',
              role: 'professional',
            },
          },
        },
      },
    });
  }

  console.log('Seeded 3 experts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
