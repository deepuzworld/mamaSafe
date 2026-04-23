import prisma from './src/utils/prisma';
import bcrypt from 'bcryptjs';
import { sendPartnerInvite } from './src/utils/mailer';

async function main() {
    const email = "yafixe4036@dwseal.com";
    const fullName = "Test Partner";
    const tempPassword = Math.random().toString(36).slice(-8);
    
    console.log(`Setting up partner for ${email}...`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'partner',
            mustResetPassword: true,
            otpCreatedAt: new Date()
        },
        create: {
            fullName,
            email,
            passwordHash,
            role: 'partner',
            mustResetPassword: true,
            otpCreatedAt: new Date()
        }
    });

    console.log(`User ${user.email} updated/created.`);
    console.log(`TEMPORARY PASSWORD (OTP): ${tempPassword}`);
    
    await sendPartnerInvite(email, tempPassword, fullName);
    
    console.log('OTP sending process triggered.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
