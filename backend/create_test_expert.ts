import prisma from './src/utils/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendExpertInvite } from './src/utils/mailer';

async function createExpert() {
    const fullName = "Dr. Deepak Mathew";
    const email = "deepakmathew6105@gmail.com";
    const specialization = "General Pediatrics";
    const licenseNo = "MED-123456";

    console.log('Initiating test expert creation...');

    // Clean up if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('Cleaning up existing user...');
        await prisma.user.delete({ where: { email } });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            passwordHash,
            role: 'professional',
            mustResetPassword: true,
            otpCreatedAt: new Date()
        }
    });

    const expert = await (prisma.expert as any).create({
        data: {
            userId: user.userId,
            specialization,
            licenseNo,
            isVerified: true
        }
    });

    console.log(`Expert created in DB. ID: ${expert.expertId}`);
    console.log(`Temp password generated: ${tempPassword}`);
    console.log('Sending email...');
    
    await sendExpertInvite(email, tempPassword, fullName);
    console.log('Email dispatched correctly!');
}

createExpert().catch(err => {
    console.error('An error occurred: ', err);
}).finally(() => {
    prisma.$disconnect();
});
