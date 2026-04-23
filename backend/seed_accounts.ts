import prisma from './src/utils/prisma';
import bcrypt from 'bcryptjs';

async function seedAccounts() {
    console.log('Seeding Test Accounts...');
    const salt = await bcrypt.genSalt(10);

    // 1. Admin
    const adminPass = await bcrypt.hash('admin123', salt);
    await prisma.user.upsert({
        where: { email: 'admin@mamasafe.com' },
        update: { passwordHash: adminPass, mustResetPassword: false },
        create: {
            fullName: 'Admin Test',
            email: 'admin@mamasafe.com',
            passwordHash: adminPass,
            role: 'admin',
            mustResetPassword: false
        }
    });

    // 2. Mother
    const motherPass = await bcrypt.hash('mother123', salt);
    const mother = await prisma.user.upsert({
        where: { email: 'mother@mamasafe.com' },
        update: { passwordHash: motherPass, mustResetPassword: false },
        create: {
            fullName: 'Mother Test',
            email: 'mother@mamasafe.com',
            passwordHash: motherPass,
            role: 'mother',
            mustResetPassword: false
        }
    });

    await prisma.profile.upsert({
        where: { userId: mother.userId },
        update: { firstPregnancy: true, historyOfBipolar: false },
        create: {
            userId: mother.userId,
            firstPregnancy: true,
            historyOfBipolar: false,
            babyBirthDate: new Date()
        }
    });

    // 3. Partner
    const partnerPass = await bcrypt.hash('partner123', salt);
    const partner = await prisma.user.upsert({
        where: { email: 'partner@mamasafe.com' },
        update: { passwordHash: partnerPass, mustResetPassword: false },
        create: {
            fullName: 'Partner Test',
            email: 'partner@mamasafe.com',
            passwordHash: partnerPass,
            role: 'partner',
            mustResetPassword: false
        }
    });

    console.log('Test accounts successfully created/updated:');
    console.log('- Admin: admin@mamasafe.com / admin123');
    console.log('- Mother: mother@mamasafe.com / mother123');
    console.log('- Partner: partner@mamasafe.com / partner123');
}

seedAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
