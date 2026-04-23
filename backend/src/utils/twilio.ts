import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export const sendEmergencySMS = async (to: string, message: string) => {
    if (!client) {
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return { success: true, mock: true };
    }

    try {
        const response = await client.messages.create({
            body: message,
            from: fromPhoneNumber,
            to: to
        });
        console.log(`[SMS SENT] SID: ${response.sid}`);
        return { success: true, sid: response.sid };
    } catch (error: any) {
        console.error(`[SMS ERROR] ${error.message}`);
        return { success: false, error: error.message };
    }
};

export const triggerEmergencyCall = async (to: string, motherName: string) => {
    if (!client) {
        console.log(`[MOCK CALL] To: ${to}, Content: Emergency alert for ${motherName}`);
        return { success: true, mock: true };
    }

    try {
        const response = await client.calls.create({
            twiml: `<Response><Say voice="alice">Emergency alert from MamaSafe. Your partner ${motherName} is experiencing intense distress and has activated the Red Button. Please check on her immediately.</Say></Response>`,
            from: fromPhoneNumber,
            to: to
        });
        console.log(`[CALL TRIGGERED] SID: ${response.sid}`);
        return { success: true, sid: response.sid };
    } catch (error: any) {
        console.error(`[CALL ERROR] ${error.message}`);
        return { success: false, error: error.message };
    }
};
