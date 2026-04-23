import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- Testing Pulse Activation Logic ---");
    
    // 1. Find a Mother with a Partner
    const bridge = await prisma.partnerBridge.findFirst({
        include: {
            motherUser: true,
            partnerUser: true
        }
    });

    if (!bridge) {
        console.error("No PartnerBridge found. Please link a partner first.");
        return;
    }

    const { motherUser, partnerUser } = bridge;
    console.log(`Found Mother: ${motherUser.fullName} (${motherUser.userId})`);
    console.log(`Found Partner: ${partnerUser?.fullName || 'No partner user'} / Email: ${bridge.partnerEmail}`);
    console.log(`Partner Phone: ${partnerUser?.phoneNumber || 'No phone'}`);

    // 2. Simulate Red Button logic
    console.log("\nSimulating red-button API call...");
    const message = `EMERGENCY: ${motherUser.fullName} has activated the MamaSafe Red Button. She needs immediate support. Location: Simulation Test`;
    
    console.log(`[ACTION] Sending SMS to ${partnerUser?.phoneNumber}: ${message}`);
    console.log(`[ACTION] Triggering Voice Call to ${partnerUser?.phoneNumber} for mother ${motherUser.fullName}`);

    // 3. Create Event in DB
    const event = await prisma.redButtonEvent.create({
        data: {
            userId: motherUser.userId,
            emergencyStatus: 'active'
        }
    });
    console.log(`\nEvent created in DB: ${event.eventId}`);
    console.log("--- Test Complete ---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
