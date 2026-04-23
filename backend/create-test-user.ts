import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'testmama@example.com';
    const password = 'Password123!';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        console.log('User already exists. Email:', email, 'Password:', password);
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            fullName: 'Test Mama',
            email,
            passwordHash,
            role: 'mother'
        }
    });

    await prisma.faceVerification.create({
        data: {
            userId: user.userId,
            verificationStatus: 'verified',
            verifiedAt: new Date(),
            faceIoId: 'manual-test'
        }
    });

    console.log('Successfully created user:');
    console.log('Email:', email);
    console.log('Password:', password);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
