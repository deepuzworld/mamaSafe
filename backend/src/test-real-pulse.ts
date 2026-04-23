import { PrismaClient } from '@prisma/client';
import { sendSMS, triggerCall } from './utils/selfHostedStack';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("--- Real Stack Test (Twilio) ---");
    console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
    console.log("Service SID:", process.env.TWILIO_MESSAGING_SERVICE_SID);
    
    const partnerPhone = "+919526836796";
    const motherName = "Gauri Menon";
    const message = `EMERGENCY TEST: ${motherName} has activated the Red Button.`;

    console.log(`Attempting to send SMS to ${partnerPhone}...`);
    const smsRes = await sendSMS(partnerPhone, message);
    console.log("SMS Result:", smsRes);

    console.log(`\nAttempting to trigger Call to ${partnerPhone}...`);
    const callRes = await triggerCall(partnerPhone, motherName);
    console.log("Call Result:", callRes);

    console.log("--- Test Complete ---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
