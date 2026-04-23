import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const defaultPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const testUsers = [
        {
            fullName: 'Test Mother',
            email: 'mother@example.com',
            role: 'mother',
            faceVerifyStatus: true,
        },
        {
            fullName: 'Test Partner',
            email: 'partner@example.com',
            role: 'partner',
            faceVerifyStatus: true,
        },
        {
            fullName: 'Test Admin',
            email: 'admin@example.com',
            role: 'admin',
            faceVerifyStatus: true,
        },
        {
            fullName: 'Test Professional',
            email: 'pro@example.com',
            role: 'professional',
            faceVerifyStatus: true,
        }
    ];

    for (const u of testUsers) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { passwordHash, faceVerifyStatus: true, role: u.role },
            create: {
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                passwordHash,
                faceVerifyStatus: true
            }
        });
    }

    // Update existing experts to same password just in case
    await prisma.user.updateMany({
        data: { passwordHash }
    });

    const users = await prisma.user.findMany({
        select: {
            fullName: true,
            email: true,
            role: true
        },
        orderBy: {
            role: 'asc'
        }
    });

    console.log('--- ALL SYSTEM USERS ---');
    console.log(`Password for all these users is strictly reset to: ${defaultPassword}\n`);
    users.forEach(u => {
        console.log(`Role: ${u.role.toUpperCase()} | Name: ${u.fullName}`);
        console.log(`Email: ${u.email}`);
        console.log('-----------------------------');
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
