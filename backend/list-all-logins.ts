import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const defaultPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // Update all users to have the default password
    await prisma.user.updateMany({
        data: { passwordHash }
    });

    // Fetch all users
    const users = await prisma.user.findMany({
        select: {
            fullName: true,
            email: true,
            role: true
        }
    });

    console.log('--- ALL USERS LOGIN INFO ---');
    console.log(`Password for all users: ${defaultPassword}\n`);
    users.forEach(u => {
        console.log(`Name: ${u.fullName} | Role: ${u.role}`);
        console.log(`Email: ${u.email}`);
        console.log('-----------------------------');
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
