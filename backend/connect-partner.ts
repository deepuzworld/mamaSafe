import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectPartner() {
    const mother = await prisma.user.findUnique({ where: { email: 'mother@mamasafe.com' } });
    const partner = await prisma.user.findUnique({ where: { email: 'partner@mamasafe.com' } });

    if (!mother || !partner) {
        console.error('Mother or Partner not found. Run create-test-users-all-roles.ts first.');
        return;
    }

    const bridge = await prisma.partnerBridge.create({
        data: {
            motherUserId: mother.userId,
            partnerUserId: partner.userId,
            partnerEmail: partner.email,
            accessLevel: 'AlertsOnly',
            alertNotification: true
        }
    });

    console.log('Successfully connected partner to mother:', bridge);
}

connectPartner()
    .catch(e => {
        console.error(e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
